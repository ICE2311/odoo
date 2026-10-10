import { db } from '@/server/db';
import { settings, memberships, users } from '@/server/db/schema';
import { eq, and, lte, gt, desc } from 'drizzle-orm';
import { registerPurpose } from './payments';
import { recordEntry } from './ledger';
import { enqueueEmail } from './email';
import crypto from 'crypto';

export async function getSeasonEndDate(now: Date) {
  const setting = await db.query.settings.findFirst({ where: eq(settings.key, 'season_end_month_day') });
  const md = setting?.valueJson as string || '05-31';
  const [mm, dd] = md.split('-');
  let end = new Date(now.getFullYear(), parseInt(mm) - 1, parseInt(dd), 23, 59, 59, 999);
  
  if (now > end) {
    end.setFullYear(end.getFullYear() + 1);
  }
  return end;
}

export async function getRenewalWindowDays() {
  const setting = await db.query.settings.findFirst({ where: eq(settings.key, 'renewal_window_days') });
  return (setting?.valueJson as number) ?? 30;
}

export async function calculateMembershipDates(userId: string, now: Date = new Date()) {
  const active = await db.query.memberships.findFirst({
    where: and(
      eq(memberships.userId, userId),
      eq(memberships.status, 'active'),
      lte(memberships.startsAt, now),
      gt(memberships.endsAt, now)
    )
  });

  if (!active) {
    return { startsAt: now, endsAt: await getSeasonEndDate(now) };
  }

  const renewalDays = await getRenewalWindowDays();
  const msUntilExpiry = active.endsAt.getTime() - now.getTime();
  const daysUntilExpiry = msUntilExpiry / (1000 * 60 * 60 * 24);

  if (daysUntilExpiry <= renewalDays) {
    return { startsAt: active.endsAt, endsAt: await getSeasonEndDate(active.endsAt) };
  }

  throw new Error('Cannot buy overlapping membership. Please wait until your current membership is closer to expiry.');
}

registerPurpose('membership', {
  computeAmount: async (purposeId, caller) => {
    const setting = await db.query.settings.findFirst({ where: eq(settings.key, 'membership_price_paise') });
    return (setting?.valueJson as number) ?? 50000;
  },
  onCaptured: async ({ tx, payment }) => {
    const memId = payment.purposeId;
    const [mem] = await tx.select().from(memberships).where(eq(memberships.id, memId));
    if (!mem || mem.status !== 'pending') throw new Error('Invalid or already active membership');

    // Re-verify dates inside tx just in case
    const now = new Date();
    const dates = await calculateMembershipDates(mem.userId, now);

    await tx.update(memberships).set({
      status: 'active',
      startsAt: dates.startsAt,
      endsAt: dates.endsAt,
      paymentId: payment.id,
      method: 'razorpay'
    }).where(eq(memberships.id, memId));

    await recordEntry(tx, {
      direction: 'in',
      amountPaise: payment.amountPaise,
      category: 'membership_dues',
      method: 'razorpay',
      sourceType: 'membership',
      sourceId: memId,
      description: 'Membership Dues',
    });

    const [user] = await tx.select().from(users).where(eq(users.id, mem.userId));
    if (user && user.email) {
      await enqueueEmail({
        toEmail: user.email,
        subject: 'Welcome to Skyline SSA!',
        html: `<p>Your membership is confirmed! View your card in your account.</p>`,
        text: `Your membership is confirmed! View your card in your account.`,
        kind: 'transactional',
        refType: 'membership',
        refId: memId
      }, tx);
    }
  },
  onFailed: async ({ tx, payment }) => {
    const memId = payment.purposeId;
    await tx.update(memberships).set({ status: 'cancelled' }).where(eq(memberships.id, memId));
  },
  onRefunded: async ({ tx, payment, refund }) => {
    const memId = payment.purposeId;
    await tx.update(memberships).set({ status: 'refunded' }).where(eq(memberships.id, memId));
    await recordEntry(tx, {
      direction: 'out',
      amountPaise: refund.amountPaise,
      category: 'refund',
      method: 'razorpay',
      sourceType: 'membership_refund',
      sourceId: refund.id,
      description: 'Membership Refund',
    });
  }
});

export function generateMemberQrToken(userId: string) {
  const text = `m:${userId}`;
  const sig = crypto.createHmac('sha256', process.env.QR_SIGNING_SECRET || 'secret').update(text).digest('hex');
  return `${text}|${sig}`;
}

export function verifyMemberQrToken(token: string) {
  const [text, sig] = token.split('|');
  if (!text || !sig) return null;
  const [m, userId] = text.split(':');
  if (m !== 'm' || !userId) return null;
  const expectedSig = crypto.createHmac('sha256', process.env.QR_SIGNING_SECRET || 'secret').update(text).digest('hex');
  if (sig !== expectedSig) return null;
  return userId;
}

// Hook list for lapsing
export const onMembershipLapsedHooks: Array<(userId: string, tx: any) => Promise<void>> = [];
