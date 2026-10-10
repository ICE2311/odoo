import { requireMember } from '@/server/auth/guards';
import { getMyExpenseClaims } from '@/server/data/me/expenses';
import { ExpensesClient } from './expenses-client';

export default async function MemberExpensesPage() {
  await requireMember();
  const claims = await getMyExpenseClaims();

  const formatted = claims.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    amountPaise: c.amountPaise,
    spentOn: c.spentOn,
    status: c.status,
    createdAt: c.createdAt,
    receiptUrls: c.receiptUrls,
    eventId: c.eventId,
    fundraiserId: c.fundraiserId,
    rejectionReason: c.rejectionReason,
    payeeUpiId: c.payeeUpiId,
    payoutMethod: c.payoutMethod,
    payoutRef: c.payoutRef,
    eventName: c.eventName,
    fundraiserName: c.fundraiserName,
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <ExpensesClient initialClaims={formatted} />
    </div>
  );
}

