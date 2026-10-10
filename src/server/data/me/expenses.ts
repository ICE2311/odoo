import { db } from '@/server/db';
import { expenseClaims, events, fundraisers, ledgerEntries } from '@/server/db/schema';
import { requireUser } from '@/server/auth/guards';
import { desc, eq, and } from 'drizzle-orm';

export async function getMyExpenseClaims() {
  const caller = await requireUser();
  const claims = await db.select({
    id: expenseClaims.id,
    title: expenseClaims.title,
    description: expenseClaims.description,
    amountPaise: expenseClaims.amountPaise,
    spentOn: expenseClaims.spentOn,
    status: expenseClaims.status,
    createdAt: expenseClaims.createdAt,
    receiptUrls: expenseClaims.receiptUrls,
    eventId: expenseClaims.eventId,
    fundraiserId: expenseClaims.fundraiserId,
    rejectionReason: expenseClaims.rejectionReason,
    payeeUpiId: expenseClaims.payeeUpiId,
    payoutMethod: expenseClaims.payoutMethod,
    payoutRef: expenseClaims.payoutRef,
    eventName: events.title,
    fundraiserName: fundraisers.name,
  })
  .from(expenseClaims)
  .leftJoin(events, eq(expenseClaims.eventId, events.id))
  .leftJoin(fundraisers, eq(expenseClaims.fundraiserId, fundraisers.id))
  .where(eq(expenseClaims.claimantId, caller.user.id))
  .orderBy(desc(expenseClaims.createdAt));
  
  return claims;
}

export async function getMySubmittedTakings() {
  const caller = await requireUser();
  const takings = await db
    .select({
      id: ledgerEntries.id,
      amountPaise: ledgerEntries.amountPaise,
      category: ledgerEntries.category,
      method: ledgerEntries.method,
      description: ledgerEntries.description,
      occurredAt: ledgerEntries.occurredAt,
      fundraiserName: fundraisers.name,
      eventName: events.title,
    })
    .from(ledgerEntries)
    .leftJoin(fundraisers, eq(ledgerEntries.fundraiserId, fundraisers.id))
    .leftJoin(events, eq(ledgerEntries.eventId, events.id))
    .where(
      and(
        eq(ledgerEntries.recordedBy, caller.user.id),
        eq(ledgerEntries.direction, 'in')
      )
    )
    .orderBy(desc(ledgerEntries.occurredAt));

  return takings;
}
