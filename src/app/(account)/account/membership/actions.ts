'use server';

import { db } from '@/server/db';
import { memberships, settings } from '@/server/db/schema';
import { requireUser } from '@/server/auth/guards';
import { eq, and, lte, gt, desc } from 'drizzle-orm';
import {
  calculateMembershipDates,
  getSeasonEndDate,
  getRenewalWindowDays,
  generateMemberQrToken,
} from '@/server/services/membership';
import { createCheckout, verifyClientPayment } from '@/server/services/payments';
import QRCode from 'qrcode';

export async function getMembershipPageData() {
  const caller = await requireUser();
  const now = new Date();

  // Find active membership
  const activeMem = await db.query.memberships.findFirst({
    where: and(
      eq(memberships.userId, caller.user.id),
      eq(memberships.status, 'active'),
      lte(memberships.startsAt, now),
      gt(memberships.endsAt, now)
    ),
  });

  // Find latest past membership if not active
  const latestMem =
    activeMem ||
    (await db.query.memberships.findFirst({
      where: eq(memberships.userId, caller.user.id),
      orderBy: [desc(memberships.endsAt)],
    }));

  const renewalDays = await getRenewalWindowDays();
  const setting = await db.query.settings.findFirst({
    where: eq(settings.key, 'membership_price_paise'),
  });
  const pricePaise = (setting?.valueJson as number) ?? 50000;

  let canBuyOrRenew = true;
  let reasonCannotRenew: string | null = null;
  let daysRemaining = 0;
  let qrToken: string | null = null;
  let qrDataUrl: string | null = null;

  if (activeMem) {
    const msUntilExpiry = activeMem.endsAt.getTime() - now.getTime();
    daysRemaining = Math.max(0, Math.ceil(msUntilExpiry / (1000 * 60 * 60 * 24)));
    qrToken = generateMemberQrToken(caller.user.id);
    try {
      qrDataUrl = await QRCode.toDataURL(qrToken, { width: 190, margin: 1 });
    } catch {
      qrDataUrl = null;
    }

    if (daysRemaining > renewalDays) {
      canBuyOrRenew = false;
      const formattedDate = new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(activeMem.endsAt);
      reasonCannotRenew = `Your membership is active and valid until ${formattedDate}. Renewal opens ${renewalDays} days before expiration.`;
    }
  }

  const nextSeasonEnd = await getSeasonEndDate(now);
  const formattedNextSeasonEnd = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(nextSeasonEnd);

  return {
    user: {
      id: caller.user.id,
      name: caller.user.name || caller.user.email.split('@')[0],
      email: caller.user.email,
    },
    isActive: !!activeMem,
    membership: activeMem
      ? {
          id: activeMem.id,
          status: activeMem.status,
          startsAt: activeMem.startsAt.toISOString(),
          endsAt: activeMem.endsAt.toISOString(),
          pricePaise: activeMem.pricePaise,
        }
      : latestMem
        ? {
            id: latestMem.id,
            status: latestMem.status,
            startsAt: latestMem.startsAt.toISOString(),
            endsAt: latestMem.endsAt.toISOString(),
            pricePaise: latestMem.pricePaise,
          }
        : null,
    daysRemaining,
    renewalDays,
    canBuyOrRenew,
    reasonCannotRenew,
    pricePaise,
    nextSeasonEnd: formattedNextSeasonEnd,
    qrToken,
    qrDataUrl,
  };
}

export async function createPendingMembership() {
  const caller = await requireUser();
  const now = new Date();

  // Validate date calculation & overlap check early
  const dates = await calculateMembershipDates(caller.user.id, now);

  const setting = await db.query.settings.findFirst({
    where: eq(settings.key, 'membership_price_paise'),
  });
  const price = (setting?.valueJson as number) ?? 50000;

  const [mem] = await db
    .insert(memberships)
    .values({
      userId: caller.user.id,
      status: 'pending',
      startsAt: dates.startsAt,
      endsAt: dates.endsAt,
      pricePaise: price,
      method: 'razorpay',
    })
    .returning();

  return mem.id;
}

export async function purchaseMembershipDirectAction() {
  const caller = await requireUser();
  const memId = await createPendingMembership();
  const checkoutData = await createCheckout('membership', memId, caller);
  await verifyClientPayment(checkoutData.rzOrderId, 'pay_direct_dev', 'simulated');
  return { success: true };
}
