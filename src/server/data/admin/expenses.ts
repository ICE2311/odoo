import { db } from '@/server/db';
import { expenseClaims, users, events, fundraisers } from '@/server/db/schema';
import { requireAdmin } from '@/server/auth/guards';
import { desc, eq, getTableColumns, sql } from 'drizzle-orm';

export async function getAdminExpenseClaims() {
  await requireAdmin();
  const claims = await db.select({
    ...getTableColumns(expenseClaims),
    claimantName: users.name,
    claimantEmail: users.email,
    eventName: events.title,
    fundraiserName: fundraisers.name,
    fundraiserBudgetPaise: fundraisers.budgetPaise,
    fundraiserSpentPaise: sql<number>`(SELECT COALESCE(SUM(amount_paise), 0) FROM ${expenseClaims} WHERE fundraiser_id = ${fundraisers.id} AND status IN ('approved', 'paid'))`.mapWith(Number),
    eventSpentPaise: sql<number>`(SELECT COALESCE(SUM(amount_paise), 0) FROM ${expenseClaims} WHERE event_id = ${events.id} AND status IN ('approved', 'paid'))`.mapWith(Number)
  })
  .from(expenseClaims)
  .leftJoin(users, eq(expenseClaims.claimantId, users.id))
  .leftJoin(events, eq(expenseClaims.eventId, events.id))
  .leftJoin(fundraisers, eq(expenseClaims.fundraiserId, fundraisers.id))
  .orderBy(desc(expenseClaims.createdAt));
  
  return claims;
}
