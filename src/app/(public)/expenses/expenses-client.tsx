'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Receipt, Plus, Clock, CheckCircle2, DollarSign, XCircle, 
  ExternalLink, Calendar, RefreshCw, AlertCircle, ArrowLeft, ArrowUpRight 
} from 'lucide-react';
import { withdrawClaimAction } from '@/server/actions/expenses';
import { useRouter } from 'next/navigation';

export interface ExpenseClaimItem {
  id: string;
  title: string;
  description: string;
  amountPaise: number;
  spentOn: string;
  status: string;
  createdAt: Date;
  receiptUrls: string[] | null;
  eventId: string | null;
  fundraiserId: string | null;
  rejectionReason: string | null;
  payeeUpiId: string | null;
  payoutMethod: string | null;
  payoutRef: string | null;
  eventName: string | null;
  fundraiserName: string | null;
}

export function ExpensesClient({ initialClaims }: { initialClaims: ExpenseClaimItem[] }) {
  const [claims, setClaims] = useState<ExpenseClaimItem[]>(initialClaims);
  const [activeFilter, setActiveFilter] = useState<'all' | 'submitted' | 'approved' | 'paid' | 'rejected'>('all');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const totalPaise = claims.reduce((acc, c) => acc + c.amountPaise, 0);
  const paidPaise = claims.filter(c => c.status === 'paid').reduce((acc, c) => acc + c.amountPaise, 0);
  const pendingPaise = claims.filter(c => c.status === 'submitted' || c.status === 'approved').reduce((acc, c) => acc + c.amountPaise, 0);

  const filteredClaims = activeFilter === 'all'
    ? claims
    : claims.filter(c => c.status === activeFilter);

  const handleWithdraw = async (claimId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to withdraw the claim "${title}"?`)) return;

    startTransition(async () => {
      try {
        await withdrawClaimAction(claimId);
        setClaims(prev => prev.filter(c => c.id !== claimId));
        router.refresh();
      } catch (err: any) {
        alert(err.message || 'Failed to withdraw claim');
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/account"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Account
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Receipt className="w-8 h-8 text-primary" />
            Volunteer Expenses & Ledger Claims
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track and submit your expense reimbursement claims and event takings to be recorded in the club ledger.
          </p>
        </div>

        <Link href="/expenses/new">
          <Button className="h-11 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Submit Claim</span>
          </Button>
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border border-border shadow-sm p-5 bg-card">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Incurred</div>
          <div className="text-2xl font-extrabold text-foreground mt-1">₹{(totalPaise / 100).toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{claims.length} total submitted claims</div>
        </Card>

        <Card className="rounded-2xl border border-border shadow-sm p-5 bg-card">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending Review</div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">₹{(pendingPaise / 100).toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {claims.filter(c => c.status === 'submitted' || c.status === 'approved').length} claims in approval queue
          </div>
        </Card>

        <Card className="rounded-2xl border border-border shadow-sm p-5 bg-card">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reimbursed & Logged</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">₹{(paidPaise / 100).toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {claims.filter(c => c.status === 'paid').length} claims paid into ledger
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {(['all', 'submitted', 'approved', 'paid', 'rejected'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
              activeFilter === tab
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {tab === 'all' ? 'All Claims' : tab === 'submitted' ? 'Pending Review' : tab}
            <span className="ml-1.5 opacity-80">
              ({tab === 'all' ? claims.length : claims.filter(c => c.status === tab).length})
            </span>
          </button>
        ))}
      </div>

      {/* Claims List */}
      {filteredClaims.length === 0 ? (
        <Card className="rounded-2xl border border-border p-12 text-center shadow-sm">
          <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
          <h3 className="font-bold text-foreground text-lg">No expense claims found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {activeFilter === 'all'
              ? 'You have not submitted any expense reimbursement claims yet. Incurred expenses while volunteering? Click below to submit.'
              : `No claims currently have status "${activeFilter}".`}
          </p>
          <div className="mt-5">
            <Link href="/expenses/new">
              <Button size="sm" className="rounded-xl font-semibold gap-1.5">
                <Plus className="w-4 h-4" /> Submit an Expense Claim
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3.5">
          {filteredClaims.map((claim) => (
            <Card key={claim.id} className="rounded-2xl border border-border shadow-sm overflow-hidden hover:border-primary/40 transition-colors">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        claim.status === 'paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : claim.status === 'approved'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : claim.status === 'submitted'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {claim.status === 'paid' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {claim.status === 'approved' && <DollarSign className="w-3.5 h-3.5" />}
                        {claim.status === 'submitted' && <Clock className="w-3.5 h-3.5" />}
                        {claim.status === 'rejected' && <XCircle className="w-3.5 h-3.5" />}
                        {claim.status === 'submitted' ? 'In Review' : claim.status}
                      </span>

                      {claim.eventName && (
                        <Badge variant="outline" className="text-xs font-medium text-primary border-primary/30">
                          Event: {claim.eventName}
                        </Badge>
                      )}

                      {claim.fundraiserName && (
                        <Badge variant="outline" className="text-xs font-medium text-accent border-accent/30">
                          Fundraiser: {claim.fundraiserName}
                        </Badge>
                      )}

                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Spent on {new Date(claim.spentOn).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-foreground">{claim.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{claim.description}</p>

                    {/* Rejection notice */}
                    {claim.rejectionReason && (
                      <div className="mt-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-950 font-medium flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Reason for Rejection:</strong> {claim.rejectionReason}
                        </div>
                      </div>
                    )}

                    {/* Paid details */}
                    {claim.status === 'paid' && claim.payoutRef && (
                      <div className="mt-2 text-xs text-emerald-800 font-medium">
                        ✓ Reimbursed via {claim.payoutMethod?.toUpperCase()} (Ref: <span className="font-mono">{claim.payoutRef}</span>) and recorded into Treasury Ledger.
                      </div>
                    )}

                    {/* Receipts preview links */}
                    {claim.receiptUrls && claim.receiptUrls.length > 0 && (
                      <div className="pt-2 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold uppercase text-muted-foreground">Receipts:</span>
                        {claim.receiptUrls.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium bg-muted/60 px-2 py-0.5 rounded-md"
                          >
                            Receipt {idx + 1} <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:items-end justify-between gap-3 shrink-0">
                    <div className="text-2xl font-black text-foreground">
                      ₹{(claim.amountPaise / 100).toFixed(2)}
                    </div>

                    {claim.status === 'submitted' && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleWithdraw(claim.id, claim.title)}
                        className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 rounded-xl"
                      >
                        {isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Withdraw Claim'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

