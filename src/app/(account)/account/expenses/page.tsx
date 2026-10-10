import { requireMember } from '@/server/auth/guards';
import { getMyExpenseClaims, getMySubmittedTakings } from '@/server/data/me/expenses';
import { ExpensesClient } from '@/app/(public)/expenses/expenses-client';

export default async function AccountExpensesPage() {
  await requireMember();
  const [claims, takings] = await Promise.all([
    getMyExpenseClaims(),
    getMySubmittedTakings(),
  ]);

  const formattedClaims = claims.map((c) => ({
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

  const formattedTakings = takings.map((t) => ({
    id: t.id,
    amountPaise: t.amountPaise,
    category: t.category,
    method: t.method,
    description: t.description,
    occurredAt: t.occurredAt,
    fundraiserName: t.fundraiserName,
    eventName: t.eventName,
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <ExpensesClient
        initialClaims={formattedClaims}
        initialTakings={formattedTakings}
      />
    </div>
  );
}
