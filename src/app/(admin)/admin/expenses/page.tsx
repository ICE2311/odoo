import { getAdminExpenseClaims } from '@/server/data/admin/expenses';
import { requireAdmin, getCaller } from '@/server/auth/guards';
import { PageHeader } from '@/components/page-header';
import { AdminExpensesClient, AdminExpenseClaimItem } from './admin-expenses-client';

export default async function AdminExpensesPage() {
  await requireAdmin();
  const caller = await getCaller();
  const currentUserId = caller.kind === 'user' ? caller.user.id : null;

  const rawClaims = await getAdminExpenseClaims();

  const formattedClaims: AdminExpenseClaimItem[] = rawClaims.map((c) => ({
    id: c.id,
    claimantId: c.claimantId,
    claimantName: c.claimantName,
    claimantEmail: c.claimantEmail,
    title: c.title,
    description: c.description,
    amountPaise: c.amountPaise,
    spentOn: c.spentOn,
    status: c.status as any,
    receiptUrls: c.receiptUrls,
    payeeUpiId: c.payeeUpiId,
    eventId: c.eventId,
    fundraiserId: c.fundraiserId,
    reviewedBy: c.reviewedBy,
    reviewedAt: c.reviewedAt ? c.reviewedAt.toISOString() : null,
    rejectionReason: c.rejectionReason,
    paidBy: c.paidBy,
    paidAt: c.paidAt ? c.paidAt.toISOString() : null,
    payoutMethod: c.payoutMethod,
    payoutRef: c.payoutRef,
    createdAt: c.createdAt.toISOString(),
    eventName: c.eventName,
    fundraiserName: c.fundraiserName,
    fundraiserBudgetPaise: c.fundraiserBudgetPaise,
    fundraiserSpentPaise: c.fundraiserSpentPaise,
    eventSpentPaise: c.eventSpentPaise,
  }));

  const submitted = formattedClaims.filter((c) => c.status === 'submitted');
  const approved = formattedClaims.filter((c) => c.status === 'approved');
  const paid = formattedClaims.filter((c) => c.status === 'paid');

  return (
    <div className="space-y-8">
      <PageHeader
        title="Expense Claims & Reimbursements"
        subtitle={`${submitted.length} pending review • ${approved.length} approved • ${paid.length} reimbursed`}
      />

      <AdminExpensesClient claims={formattedClaims} currentUserId={currentUserId} />
    </div>
  );
}
