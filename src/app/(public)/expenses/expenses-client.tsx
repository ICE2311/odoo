'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Receipt, Plus, Clock, CheckCircle2, DollarSign, XCircle, 
  ExternalLink, Calendar, RefreshCw, AlertCircle, ArrowLeft, 
  ArrowUpRight, ArrowDownLeft, Coins, Wallet
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

export interface SubmittedTakingItem {
  id: string;
  amountPaise: number;
  category: string;
  method: string;
  description: string | null;
  occurredAt: Date;
  fundraiserName: string | null;
  eventName: string | null;
}

function formatCategory(cat: string): string {
  switch (cat) {
    case 'fundraiser_income':
      return 'Fundraiser Takings';
    case 'ticket_sales':
      return 'Door Ticket Sales';
    case 'merch_sales':
      return 'Merch Takings';
    case 'manual_income':
      return 'General Club Takings';
    default:
      return cat.replace(/_/g, ' ');
  }
}

function formatMethod(method: string): string {
  switch (method) {
    case 'cash':
      return 'Cash Collection';
    case 'upi_manual':
      return 'UPI (Manual)';
    case 'bank':
      return 'Bank Transfer';
    default:
      return method.toUpperCase();
  }
}

export function ExpensesClient({ 
  initialClaims, 
  initialTakings = [] 
}: { 
  initialClaims: ExpenseClaimItem[];
  initialTakings?: SubmittedTakingItem[];
}) {
  const [mainTab, setMainTab] = useState<'claims' | 'takings'>('claims');
  const [claims, setClaims] = useState<ExpenseClaimItem[]>(initialClaims);
  const [takings] = useState<SubmittedTakingItem[]>(initialTakings);
  const [activeFilter, setActiveFilter] = useState<'all' | 'submitted' | 'approved' | 'paid' | 'rejected'>('all');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Claims calculations
  const totalClaimsPaise = claims.reduce((acc, c) => acc + c.amountPaise, 0);
  const paidPaise = claims.filter(c => c.status === 'paid').reduce((acc, c) => acc + c.amountPaise, 0);
  const pendingPaise = claims.filter(c => c.status === 'submitted' || c.status === 'approved').reduce((acc, c) => acc + c.amountPaise, 0);

  // Takings calculations
  const totalTakingsPaise = takings.reduce((acc, t) => acc + t.amountPaise, 0);
  const cashTakingsPaise = takings.filter(t => t.method === 'cash').reduce((acc, t) => acc + t.amountPaise, 0);

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
            <Wallet className="w-8 h-8 text-primary" />
            Volunteer Expenses & Ledger
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Submit expense claims for reimbursement or record funds & cash takings collected during events directly into the club ledger.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/account/expenses/new?type=expense">
            <Button variant="outline" className="h-10 px-4 rounded-xl font-semibold flex items-center gap-2 border-border shadow-sm">
              <ArrowUpRight className="w-4 h-4 text-rose-500" />
              <span>File Expense Claim</span>
            </Button>
          </Link>
          <Link href="/account/expenses/new?type=income">
            <Button className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4 text-emerald-300" />
              <span>Deposit Collected Funds</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary Section Switcher */}
      <div className="grid grid-cols-2 p-1.5 bg-muted rounded-2xl border border-border">
        <button
          type="button"
          onClick={() => setMainTab('claims')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
            mainTab === 'claims'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Receipt className="w-4 h-4 text-rose-500" />
          <span>Expense Claims (Spent Money)</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-muted font-mono">
            {claims.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab('takings')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
            mainTab === 'takings'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Coins className="w-4 h-4 text-emerald-500" />
          <span>Collected Takings (Received Money)</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-muted font-mono">
            {takings.length}
          </span>
        </button>
      </div>

      {/* View Content */}
      {mainTab === 'claims' ? (
        <div className="space-y-6">
          {/* Summary KPI Cards for Claims */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="rounded-2xl border border-border shadow-sm p-5 bg-card">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Incurred</div>
              <div className="text-2xl font-extrabold text-foreground mt-1">₹{(totalClaimsPaise / 100).toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{claims.length} total claims submitted</div>
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

          {/* Claims Status Filter */}
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
                  ? 'You have not submitted any expense reimbursement claims yet. Incurred out-of-pocket costs while volunteering? File a claim to get reimbursed.'
                  : `No claims currently have status "${activeFilter}".`}
              </p>
              <div className="mt-5">
                <Link href="/account/expenses/new?type=expense">
                  <Button size="sm" className="rounded-xl font-semibold gap-1.5">
                    <Plus className="w-4 h-4" /> File an Expense Claim
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
                        <div className="text-2xl font-black text-rose-600">
                          - ₹{(claim.amountPaise / 100).toFixed(2)}
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
      ) : (
        <div className="space-y-6">
          {/* Summary KPI Cards for Takings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="rounded-2xl border border-border shadow-sm p-5 bg-card">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Funds Deposited</div>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">₹{(totalTakingsPaise / 100).toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{takings.length} total deposit transactions</div>
            </Card>

            <Card className="rounded-2xl border border-border shadow-sm p-5 bg-card">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cash Collections</div>
              <div className="text-2xl font-extrabold text-foreground mt-1">₹{(cashTakingsPaise / 100).toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Physical cash collected & logged into treasury
              </div>
            </Card>

            <Card className="rounded-2xl border border-border shadow-sm p-5 bg-card">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ledger Sync Status</div>
              <div className="text-2xl font-extrabold text-blue-600 mt-1">Directly Logged</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                All submitted takings are recorded in club ledger
              </div>
            </Card>
          </div>

          {/* Takings List */}
          {takings.length === 0 ? (
            <Card className="rounded-2xl border border-border p-12 text-center shadow-sm">
              <Coins className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
              <h3 className="font-bold text-foreground text-lg">No collected funds logged yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Did you collect cash takings, door ticket money, or donations during a club event? Deposit them to formally enter them into the club&apos;s treasury ledger.
              </p>
              <div className="mt-5">
                <Link href="/account/expenses/new?type=income">
                  <Button size="sm" className="rounded-xl font-semibold gap-1.5 bg-primary text-primary-foreground">
                    <ArrowDownLeft className="w-4 h-4" /> Deposit Collected Funds
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="space-y-3.5">
              {takings.map((taking) => (
                <Card key={taking.id} className="rounded-2xl border border-border shadow-sm overflow-hidden hover:border-emerald-500/40 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Recorded in Ledger
                          </span>

                          <Badge variant="outline" className="text-xs font-medium text-foreground bg-muted/60">
                            {formatCategory(taking.category)}
                          </Badge>

                          <Badge variant="outline" className="text-xs font-medium text-muted-foreground">
                            {formatMethod(taking.method)}
                          </Badge>

                          {taking.eventName && (
                            <Badge variant="outline" className="text-xs font-medium text-primary border-primary/30">
                              Event: {taking.eventName}
                            </Badge>
                          )}

                          {taking.fundraiserName && (
                            <Badge variant="outline" className="text-xs font-medium text-accent border-accent/30">
                              Fundraiser: {taking.fundraiserName}
                            </Badge>
                          )}

                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(taking.occurredAt).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-foreground">
                          {formatCategory(taking.category)} via {formatMethod(taking.method)}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {taking.description}
                        </p>
                      </div>

                      <div className="flex flex-col sm:items-end justify-between gap-3 shrink-0">
                        <div className="text-2xl font-black text-emerald-600">
                          + ₹{(taking.amountPaise / 100).toFixed(2)}
                        </div>
                        <span className="text-xs font-mono text-muted-foreground">
                          ID: {taking.id.slice(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
