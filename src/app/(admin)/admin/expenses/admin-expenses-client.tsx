'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Receipt, CheckCircle2, XCircle, Clock, DollarSign, 
  ExternalLink, Copy, Check, Eye, AlertTriangle, 
  Search, X, ShieldCheck, FileText, Wallet, Calendar, User, ArrowRight
} from 'lucide-react';
import { 
  approveClaimAction, 
  rejectClaimAction, 
  markPaidAction 
} from '@/server/actions/admin-expenses';

export interface AdminExpenseClaimItem {
  id: string;
  claimantId: string;
  claimantName: string | null;
  claimantEmail: string | null;
  title: string;
  description: string;
  amountPaise: number;
  spentOn: string;
  status: 'submitted' | 'approved' | 'paid' | 'rejected';
  receiptUrls: string[] | null;
  payeeUpiId: string | null;
  eventId: string | null;
  fundraiserId: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  paidBy: string | null;
  paidAt: string | null;
  payoutMethod: string | null;
  payoutRef: string | null;
  createdAt: string;
  eventName: string | null;
  fundraiserName: string | null;
  fundraiserBudgetPaise: number | null;
  fundraiserSpentPaise: number;
  eventSpentPaise: number;
}

interface AdminExpensesClientProps {
  claims: AdminExpenseClaimItem[];
  currentUserId: string | null;
}

export function AdminExpensesClient({ claims, currentUserId }: AdminExpensesClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'submitted' | 'approved' | 'paid' | 'rejected' | 'all'>('submitted');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClaim, setSelectedClaim] = useState<AdminExpenseClaimItem | null>(null);

  // Modal interaction states
  const [confirmMode, setConfirmMode] = useState<'view' | 'approve' | 'reject' | 'pay'>('view');
  const [rejectReason, setRejectReason] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'upi' | 'bank' | 'cash'>('upi');
  const [payoutRef, setPayoutRef] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  // Counts
  const submittedClaims = claims.filter((c) => c.status === 'submitted');
  const approvedClaims = claims.filter((c) => c.status === 'approved');
  const paidClaims = claims.filter((c) => c.status === 'paid');
  const rejectedClaims = claims.filter((c) => c.status === 'rejected');

  const pendingPaise = submittedClaims.reduce((acc, c) => acc + c.amountPaise, 0);
  const approvedPaise = approvedClaims.reduce((acc, c) => acc + c.amountPaise, 0);
  const paidPaise = paidClaims.reduce((acc, c) => acc + c.amountPaise, 0);

  // Filtered list
  const filteredClaims = claims.filter((c) => {
    const matchesTab = activeTab === 'all' ? true : c.status === activeTab;
    if (!matchesTab) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      (c.claimantName && c.claimantName.toLowerCase().includes(q)) ||
      (c.claimantEmail && c.claimantEmail.toLowerCase().includes(q)) ||
      (c.eventName && c.eventName.toLowerCase().includes(q)) ||
      (c.fundraiserName && c.fundraiserName.toLowerCase().includes(q))
    );
  });

  const openClaimModal = (claim: AdminExpenseClaimItem, defaultAction?: 'view' | 'approve' | 'reject' | 'pay') => {
    setSelectedClaim(claim);
    setConfirmMode(defaultAction || 'view');
    setRejectReason('');
    setPayoutMethod('upi');
    setPayoutRef(`CLM-${claim.id.slice(0, 8).toUpperCase()}`);
    setActionError(null);
    setCopiedUpi(false);
  };

  const closeModal = () => {
    if (isPending) return;
    setSelectedClaim(null);
    setConfirmMode('view');
    setActionError(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleApprove = () => {
    if (!selectedClaim) return;
    setActionError(null);

    startTransition(async () => {
      try {
        await approveClaimAction(selectedClaim.id);
        router.refresh();
        closeModal();
      } catch (err: any) {
        setActionError(err.message || 'Failed to approve claim');
      }
    });
  };

  const handleReject = () => {
    if (!selectedClaim) return;
    if (!rejectReason.trim()) {
      setActionError('Please provide a reason for rejection.');
      return;
    }
    setActionError(null);

    startTransition(async () => {
      try {
        await rejectClaimAction(selectedClaim.id, rejectReason.trim());
        router.refresh();
        closeModal();
      } catch (err: any) {
        setActionError(err.message || 'Failed to reject claim');
      }
    });
  };

  const handleMarkPaid = () => {
    if (!selectedClaim) return;
    if (!payoutRef.trim()) {
      setActionError('Please enter a payout reference or UTR number.');
      return;
    }
    setActionError(null);

    startTransition(async () => {
      try {
        await markPaidAction(selectedClaim.id, {
          payoutMethod,
          payoutRef: payoutRef.trim(),
        });
        router.refresh();
        closeModal();
      } catch (err: any) {
        setActionError(err.message || 'Failed to mark claim as paid');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border border-border shadow-xs p-5 bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            ₹{(pendingPaise / 100).toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {submittedClaims.length} claims awaiting review
          </div>
        </Card>

        <Card className="rounded-2xl border border-border shadow-xs p-5 bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Approved (Unpaid)</span>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 mt-2">
            ₹{(approvedPaise / 100).toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {approvedClaims.length} claims ready for payout
          </div>
        </Card>

        <Card className="rounded-2xl border border-border shadow-xs p-5 bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Reimbursed & Paid</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            ₹{(paidPaise / 100).toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {paidClaims.length} claims recorded in ledger
          </div>
        </Card>

        <Card className="rounded-2xl border border-border shadow-xs p-5 bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Rejected</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-foreground mt-2">
            {rejectedClaims.length}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Claims not meeting policy
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tab pills */}
        <div className="flex flex-wrap gap-2">
          {(
            [
              { key: 'submitted', label: 'Pending Review', count: submittedClaims.length },
              { key: 'approved', label: 'Approved (Awaiting Payout)', count: approvedClaims.length },
              { key: 'paid', label: 'Paid & Disbursed', count: paidClaims.length },
              { key: 'rejected', label: 'Rejected', count: rejectedClaims.length },
              { key: 'all', label: 'All Claims', count: claims.length },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab.label}{' '}
              <span className="opacity-75 font-mono">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search claimant, title, event..."
            className="pl-9 h-9 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Claims List Table */}
      {filteredClaims.length === 0 ? (
        <Card className="rounded-2xl border border-border p-12 text-center shadow-xs">
          <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
          <h3 className="font-bold text-foreground text-lg">No claims found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No claims matched your search "${searchQuery}".`
              : `There are currently no claims with status "${activeTab}".`}
          </p>
        </Card>
      ) : (
        <div className="border border-border bg-card rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase font-bold text-muted-foreground tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Claimant</th>
                  <th className="py-3.5 px-4">Expense Details</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Spent Date</th>
                  <th className="py-3.5 px-4">Related To</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredClaims.map((claim) => (
                  <tr
                    key={claim.id}
                    onClick={() => openClaimModal(claim)}
                    className="hover:bg-muted/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-foreground">
                        {claim.claimantName || 'Unknown Member'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {claim.claimantEmail}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-foreground truncate">
                        {claim.title}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {claim.description}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-black text-foreground">
                        ₹{(claim.amountPaise / 100).toFixed(2)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(claim.spentOn).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      {claim.eventName ? (
                        <Badge variant="outline" className="text-primary border-primary/30">
                          {claim.eventName}
                        </Badge>
                      ) : claim.fundraiserName ? (
                        <Badge variant="outline" className="text-accent border-accent/30">
                          {claim.fundraiserName}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          claim.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : claim.status === 'approved'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : claim.status === 'submitted'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {claim.status === 'paid' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {claim.status === 'approved' && <ShieldCheck className="w-3.5 h-3.5" />}
                        {claim.status === 'submitted' && <Clock className="w-3.5 h-3.5" />}
                        {claim.status === 'rejected' && <XCircle className="w-3.5 h-3.5" />}
                        {claim.status === 'submitted' ? 'In Review' : claim.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {claim.status === 'submitted' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openClaimModal(claim, 'approve')}
                              className="h-8 px-3 rounded-lg text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Review & Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openClaimModal(claim, 'reject')}
                              className="h-8 px-2.5 rounded-lg text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                              title="Reject Claim"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}

                        {claim.status === 'approved' && (
                          <Button
                            size="sm"
                            onClick={() => openClaimModal(claim, 'pay')}
                            className="h-8 px-3 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                          >
                            <DollarSign className="w-3.5 h-3.5 mr-1" /> Process Payout
                          </Button>
                        )}

                        {(claim.status === 'paid' || claim.status === 'rejected') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openClaimModal(claim, 'view')}
                            className="h-8 px-2.5 rounded-lg text-xs text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> View
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONFIRMATION POPUP MODAL */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in-0 duration-200">
          <div 
            className="bg-card border border-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Expense Claim Review & Confirmation
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Claim ID: <span className="font-mono">{selectedClaim.id}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={isPending}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Error Notice */}
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-950 font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Top Summary Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/40 rounded-2xl border border-border gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Claimed Reimbursement Amount
                  </span>
                  <div className="text-3xl font-black text-foreground mt-0.5">
                    ₹{(selectedClaim.amountPaise / 100).toFixed(2)}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      selectedClaim.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : selectedClaim.status === 'approved'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : selectedClaim.status === 'submitted'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {selectedClaim.status === 'paid' && <CheckCircle2 className="w-4 h-4" />}
                    {selectedClaim.status === 'approved' && <ShieldCheck className="w-4 h-4" />}
                    {selectedClaim.status === 'submitted' && <Clock className="w-4 h-4" />}
                    {selectedClaim.status === 'rejected' && <XCircle className="w-4 h-4" />}
                    {selectedClaim.status === 'submitted' ? 'Pending Review' : selectedClaim.status}
                  </span>
                </div>
              </div>

              {/* Claim Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-card border border-border rounded-xl space-y-1">
                  <div className="text-muted-foreground font-semibold flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> Claimant Information
                  </div>
                  <div className="font-bold text-foreground text-sm">
                    {selectedClaim.claimantName || 'Skyline Member'}
                  </div>
                  <div className="text-muted-foreground font-mono">
                    {selectedClaim.claimantEmail}
                  </div>
                </div>

                <div className="p-3 bg-card border border-border rounded-xl space-y-1">
                  <div className="text-muted-foreground font-semibold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Incurred Date
                  </div>
                  <div className="font-bold text-foreground text-sm">
                    {new Date(selectedClaim.spentOn).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="text-muted-foreground">
                    Submitted on {new Date(selectedClaim.createdAt).toLocaleDateString('en-IN')}
                  </div>
                </div>

                <div className="p-3 bg-card border border-border rounded-xl space-y-1 sm:col-span-2">
                  <div className="text-muted-foreground font-semibold flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5" /> Payee UPI ID (For Reimbursement)
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <span className="font-mono text-sm font-bold text-foreground bg-muted/50 px-2 py-1 rounded-md">
                      {selectedClaim.payeeUpiId || 'No UPI ID specified'}
                    </span>
                    {selectedClaim.payeeUpiId && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(selectedClaim.payeeUpiId!)}
                        className="h-8 px-2.5 rounded-lg text-xs gap-1 font-semibold"
                      >
                        {copiedUpi ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy UPI
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Association (Event or Fundraiser) */}
                {(selectedClaim.eventName || selectedClaim.fundraiserName) && (
                  <div className="p-3 bg-card border border-border rounded-xl space-y-1 sm:col-span-2">
                    <div className="text-muted-foreground font-semibold">
                      Associated Project / Budget
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedClaim.eventName && (
                        <Badge variant="outline" className="text-primary font-semibold">
                          Event: {selectedClaim.eventName}
                        </Badge>
                      )}
                      {selectedClaim.fundraiserName && (
                        <Badge variant="outline" className="text-accent font-semibold">
                          Fundraiser: {selectedClaim.fundraiserName}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Expense Title & Justification
                </span>
                <div className="p-4 bg-muted/20 border border-border rounded-xl space-y-2">
                  <h4 className="font-bold text-foreground text-base">
                    {selectedClaim.title}
                  </h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {selectedClaim.description}
                  </p>
                </div>
              </div>

              {/* Verification Receipts / Bills */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Verification Bills & Receipts ({selectedClaim.receiptUrls?.length || 0})
                </span>
                {!selectedClaim.receiptUrls || selectedClaim.receiptUrls.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
                    No receipt URLs attached to this claim.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedClaim.receiptUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-2 truncate flex-1 mr-3">
                          <FileText className="w-4 h-4 text-primary shrink-0" />
                          <span className="font-medium text-foreground truncate">
                            {url}
                          </span>
                        </div>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shrink-0 hover:opacity-90 transition-opacity"
                        >
                          <span>Open Bill</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rejection notice if rejected */}
              {selectedClaim.status === 'rejected' && selectedClaim.rejectionReason && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-950 font-medium space-y-1">
                  <div className="font-bold text-rose-700 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" /> Claim Rejected
                  </div>
                  <div>{selectedClaim.rejectionReason}</div>
                </div>
              )}

              {/* Payout details if paid */}
              {selectedClaim.status === 'paid' && selectedClaim.payoutRef && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 font-medium space-y-1">
                  <div className="font-bold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Reimbursed & Recorded in Ledger
                  </div>
                  <div>
                    Method: <span className="capitalize font-semibold">{selectedClaim.payoutMethod}</span> • Reference UTR: <span className="font-mono font-bold">{selectedClaim.payoutRef}</span>
                  </div>
                </div>
              )}

              {/* ACTION CONFIRMATION SECTIONS */}
              {/* Check if self-approval blocked */}
              {selectedClaim.status === 'submitted' && currentUserId && selectedClaim.claimantId === currentUserId ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Anti-Fraud Rule:</strong> You cannot approve your own expense claim. Another administrator must review and confirm this claim.
                  </div>
                </div>
              ) : selectedClaim.status === 'submitted' ? (
                <div className="pt-2">
                  {confirmMode === 'approve' ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        Confirm Claim Approval
                      </div>
                      <p className="text-xs text-emerald-900 leading-relaxed">
                        Are you sure you want to approve this expense claim of <strong>₹{(selectedClaim.amountPaise / 100).toFixed(2)}</strong> for <strong>{selectedClaim.claimantName || 'this member'}</strong>? Once approved, it will be moved to the payout queue and the claimant will be notified via email.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          disabled={isPending}
                          onClick={handleApprove}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs px-4"
                        >
                          {isPending ? 'Approving...' : 'Yes, Confirm & Approve Claim'}
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={isPending}
                          onClick={() => setConfirmMode('view')}
                          className="rounded-xl text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : confirmMode === 'reject' ? (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                        <XCircle className="w-5 h-5 text-rose-600" />
                        Confirm Claim Rejection
                      </div>
                      <p className="text-xs text-rose-900">
                        Please state the reason for rejecting this claim. This reason will be emailed to the claimant.
                      </p>
                      <textarea
                        rows={2}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="e.g. Receipt is blurred / missing itemized bill..."
                        className="w-full p-2.5 rounded-xl border border-rose-300 bg-white text-xs outline-none focus:ring-2 focus:ring-rose-500"
                      />
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          disabled={isPending || !rejectReason.trim()}
                          onClick={handleReject}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs px-4"
                        >
                          {isPending ? 'Rejecting...' : 'Confirm Rejection'}
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={isPending}
                          onClick={() => setConfirmMode('view')}
                          className="rounded-xl text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        onClick={() => setConfirmMode('approve')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs px-5 shadow-xs"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve & Confirm Claim
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setConfirmMode('reject')}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 rounded-xl text-xs px-4"
                      >
                        <XCircle className="w-4 h-4 mr-1.5" /> Reject Claim
                      </Button>
                    </div>
                  )}
                </div>
              ) : selectedClaim.status === 'approved' ? (
                <div className="pt-2">
                  {confirmMode === 'pay' ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                        <DollarSign className="w-5 h-5 text-emerald-600" />
                        Confirm Reimbursement Payout
                      </div>
                      <p className="text-xs text-emerald-900">
                        Confirming payout will record an outgoing entry of <strong>₹{(selectedClaim.amountPaise / 100).toFixed(2)}</strong> into the official double-entry ledger and email the claimant.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block font-bold text-emerald-950 mb-1">
                            Disbursement Method
                          </label>
                          <select
                            value={payoutMethod}
                            onChange={(e: any) => setPayoutMethod(e.target.value)}
                            className="w-full h-9 px-2.5 rounded-xl border border-emerald-300 bg-white text-xs font-medium outline-none"
                          >
                            <option value="upi">UPI Payout</option>
                            <option value="bank">Bank Transfer</option>
                            <option value="cash">Cash Handover</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-emerald-950 mb-1">
                            Transaction Ref / UTR *
                          </label>
                          <Input
                            value={payoutRef}
                            onChange={(e) => setPayoutRef(e.target.value)}
                            placeholder="e.g. UPI-93821034..."
                            className="h-9 bg-white border-emerald-300 text-xs rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          disabled={isPending}
                          onClick={handleMarkPaid}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs px-4"
                        >
                          {isPending ? 'Recording Payout...' : 'Confirm Payout & Record in Ledger'}
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={isPending}
                          onClick={() => setConfirmMode('view')}
                          className="rounded-xl text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setConfirmMode('pay')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs px-5 shadow-xs"
                    >
                      <DollarSign className="w-4 h-4 mr-1.5" /> Process Payout & Record in Ledger
                    </Button>
                  )}
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-border bg-muted/30 flex items-center justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={closeModal}
                disabled={isPending}
                className="rounded-xl text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
