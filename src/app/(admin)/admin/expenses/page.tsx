import { getAdminExpenseClaims } from '@/server/data/admin/expenses';
import { approveClaimAction, rejectClaimAction, markPaidAction } from '@/server/actions/admin-expenses';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatPaise, formatDate } from '@/lib/format';
import { CheckCircle, XCircle, DollarSign } from 'lucide-react';

export default async function AdminExpensesPage() {
  const claims = await getAdminExpenseClaims();

  const submitted = claims.filter((c) => c.status === 'submitted');
  const approved = claims.filter((c) => c.status === 'approved');
  const paid = claims.filter((c) => c.status === 'paid');
  const rejected = claims.filter((c) => c.status === 'rejected');

  return (
    <div className="space-y-8">
      <PageHeader
        title="Expense Claims"
        subtitle={`${submitted.length} pending • ${approved.length} approved • ${paid.length} paid`}
      />

      {/* Submitted claims (needs review) */}
      {submitted.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Pending Review ({submitted.length})</h2>
          <div className="border border-border bg-card rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claimant</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Related</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submitted.map((claim) => (
                  <TableRow key={claim.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{claim.claimantName}</TableCell>
                    <TableCell className="max-w-xs truncate">{claim.title}</TableCell>
                    <TableCell className="font-semibold">{formatPaise(claim.amountPaise)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(claim.spentOn)}</TableCell>
                    <TableCell className="text-sm">
                      {claim.eventName ? (
                        <span className="text-blue-600">{claim.eventName}</span>
                      ) : claim.fundraiserName ? (
                        <span className="text-purple-600">{claim.fundraiserName}</span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <form action={async () => {
                          'use server';
                          await approveClaimAction(claim.id);
                        }}>
                          <button
                            type="submit"
                            className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        </form>
                        <button
                          type="button"
                          className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {/* Approved claims (ready to pay) */}
      {approved.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Approved, Awaiting Payment ({approved.length})</h2>
          <div className="border border-border bg-card rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claimant</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reviewed</TableHead>
                  <TableHead>Related</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approved.map((claim) => (
                  <TableRow key={claim.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{claim.claimantName}</TableCell>
                    <TableCell className="max-w-xs truncate">{claim.title}</TableCell>
                    <TableCell className="font-semibold">{formatPaise(claim.amountPaise)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(claim.reviewedAt!)}</TableCell>
                    <TableCell className="text-sm">
                      {claim.eventName ? (
                        <span className="text-blue-600">{claim.eventName}</span>
                      ) : claim.fundraiserName ? (
                        <span className="text-purple-600">{claim.fundraiserName}</span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <form action={async () => {
                        'use server';
                        await markPaidAction(claim.id, {
                          payoutMethod: 'upi',
                          payoutRef: `CLM-${claim.id.slice(0, 8)}`,
                        });
                      }}>
                        <button
                          type="submit"
                          className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
                          title="Mark as paid"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {/* Paid claims */}
      {paid.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Paid ({paid.length})</h2>
          <div className="border border-border bg-card rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claimant</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paid.map((claim) => (
                  <TableRow key={claim.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{claim.claimantName}</TableCell>
                    <TableCell className="max-w-xs truncate">{claim.title}</TableCell>
                    <TableCell className="font-semibold">{formatPaise(claim.amountPaise)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(claim.paidAt!)}</TableCell>
                    <TableCell className="capitalize">{claim.payoutMethod}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{claim.payoutRef}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {/* Rejected claims */}
      {rejected.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">Rejected ({rejected.length})</h2>
          <div className="border border-border bg-card rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claimant</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rejected.map((claim) => (
                  <TableRow key={claim.id} className="hover:bg-muted/50 opacity-75">
                    <TableCell className="font-medium">{claim.claimantName}</TableCell>
                    <TableCell className="max-w-xs truncate">{claim.title}</TableCell>
                    <TableCell className="font-semibold">{formatPaise(claim.amountPaise)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{claim.rejectionReason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}
    </div>
  );
}
