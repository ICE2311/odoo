'use server'

import { requireUser, requireAdmin } from '@/server/auth/guards';
import { db } from '@/server/db';
import { memberships, users, ledgerEntries, auditLog, settings } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { calculateMembershipDates } from '@/server/services/membership';
import { recordEntry } from '@/server/services/ledger';

export async function createPendingMembership() {
  const caller = await requireUser();
  const dates = await calculateMembershipDates(caller.user.id);
  
  const setting = await db.query.settings.findFirst({ where: eq(settings.key, 'membership_price_paise') });
  const price = (setting?.valueJson as number) ?? 50000;

  const [mem] = await db.insert(memberships).values({
    userId: caller.user.id,
    status: 'pending',
    startsAt: dates.startsAt,
    endsAt: dates.endsAt,
    pricePaise: price,
    method: 'razorpay' // default will be overridden by payment if needed
  }).returning();

  return mem.id;
}

export async function adminRecordCashDues(userId: string, method: 'cash' | 'upi_manual') {
  const caller = await requireAdmin();
  
  await db.transaction(async (tx) => {
    const dates = await calculateMembershipDates(userId);
    const setting = await tx.select().from(settings).where(eq(settings.key, 'membership_price_paise'));
    const price = (setting[0]?.valueJson as number) ?? 50000;
    
    const [mem] = await tx.insert(memberships).values({
      userId,
      status: 'active',
      startsAt: dates.startsAt,
      endsAt: dates.endsAt,
      pricePaise: price,
      method,
      recordedBy: caller.user.id
    }).returning();

    await recordEntry(tx, {
      direction: 'in',
      amountPaise: price,
      category: 'membership_dues',
      method,
      sourceType: 'membership',
      sourceId: mem.id,
      description: `Manual dues by ${method}`,
      recordedBy: caller.user.id
    });

    await tx.insert(auditLog).values({
      actorId: caller.user.id,
      action: 'record_cash_dues',
      entityType: 'membership',
      entityId: mem.id,
      afterJson: mem
    });
  });
}
