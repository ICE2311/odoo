import { db } from '@/server/db';
import { expenseClaims, events, fundraisers } from '@/server/db/schema';
import { requireUser } from '@/server/auth/guards';
import { desc, eq } from 'drizzle-orm';

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

