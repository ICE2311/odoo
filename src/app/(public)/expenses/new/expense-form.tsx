'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Receipt, Plus, Trash2, ArrowLeft, RefreshCw, 
  CheckCircle2, AlertCircle, HelpCircle, Link as LinkIcon,
  IndianRupee, ArrowDownRight, ArrowUpRight, Coins, X, FileText, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { submitClaimAction, submitFundsCollectedAction } from '@/server/actions/expenses';

interface EventOption {
  id: string;
  title: string;
}

interface FundraiserOption {
  id: string;
  name: string;
}

interface ExpenseClaimFormProps {
  events: EventOption[];
  fundraisers: FundraiserOption[];
  defaultType?: 'expense' | 'income';
}

export function ExpenseClaimForm({ events, fundraisers, defaultType = 'expense' }: ExpenseClaimFormProps) {
  const router = useRouter();

  const [formType, setFormType] = useState<'expense' | 'income'>(defaultType);

  // Common fields
  const [amountRupees, setAmountRupees] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '');
  const [selectedFundraiserId, setSelectedFundraiserId] = useState(fundraisers[0]?.id || '');
  const [relatedType, setRelatedType] = useState<'general' | 'event' | 'fundraiser'>('general');

  // Expense specific fields
  const [title, setTitle] = useState('');
  const [spentOn, setSpentOn] = useState(new Date().toISOString().split('T')[0]);
  const [receiptUrls, setReceiptUrls] = useState<string[]>(['https://drive.google.com/']);
  const [payeeUpiId, setPayeeUpiId] = useState('');

  // Income / Takings specific fields
  const [incomeMethod, setIncomeMethod] = useState<'cash' | 'upi_manual' | 'bank'>('cash');
  const [incomeCategory, setIncomeCategory] = useState<'fundraiser_income' | 'ticket_sales' | 'merch_sales' | 'manual_income'>('fundraiser_income');

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddReceiptUrl = () => {
    if (receiptUrls.length < 5) {
      setReceiptUrls([...receiptUrls, '']);
    }
  };

  const handleRemoveReceiptUrl = (idx: number) => {
    setReceiptUrls(receiptUrls.filter((_, i) => i !== idx));
  };

  const handleReceiptChange = (idx: number, val: string) => {
    const updated = [...receiptUrls];
    updated[idx] = val;
    setReceiptUrls(updated);
  };

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsedRupees = parseFloat(amountRupees);
    if (isNaN(parsedRupees) || parsedRupees <= 0) {
      setErrorMsg('Please enter a valid positive amount.');
      return;
    }

    if (formType === 'expense') {
      if (!title.trim()) {
        setErrorMsg('Please enter a title or purpose for this expense.');
        return;
      }
      const cleanedUrls = receiptUrls.map((u) => u.trim()).filter(Boolean);
      if (cleanedUrls.length === 0) {
        setErrorMsg('Please provide at least one valid receipt URL (e.g. Google Drive, Dropbox, or image link).');
        return;
      }
    } else {
      if (!description.trim()) {
        setErrorMsg('Please provide a description explaining where this money was collected from.');
        return;
      }
    }

    setShowConfirmModal(true);
  };

  const handleFinalSubmit = async () => {
    setErrorMsg(null);
    const parsedRupees = parseFloat(amountRupees);
    if (isNaN(parsedRupees) || parsedRupees <= 0) {
      setErrorMsg('Please enter a valid positive amount.');
      setShowConfirmModal(false);
      return;
    }

    try {
      setSubmitting(true);
      const amountPaise = Math.round(parsedRupees * 100);

      if (formType === 'expense') {
        const cleanedUrls = receiptUrls.map((u) => u.trim()).filter(Boolean);
        await submitClaimAction({
          title: title.trim(),
          description: description.trim(),
          amountPaise,
          spentOn,
          eventId: relatedType === 'event' ? selectedEventId : null,
          fundraiserId: relatedType === 'fundraiser' ? selectedFundraiserId : null,
          receiptUrls: cleanedUrls,
          payeeUpiId: payeeUpiId.trim() || undefined,
        });
      } else {
        await submitFundsCollectedAction({
          amountPaise,
          method: incomeMethod,
          category: relatedType === 'fundraiser' ? 'fundraiser_income' : incomeCategory,
          description: description.trim(),
          fundraiserId: relatedType === 'fundraiser' ? selectedFundraiserId : null,
          eventId: relatedType === 'event' ? selectedEventId : null,
        });
      }

      setShowConfirmModal(false);
      router.push('/account/expenses');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit. Please check your inputs.');
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      <Link
        href="/account/expenses"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Treasury & Ledger
      </Link>

      {/* Mode Switcher */}
      <div className="grid grid-cols-2 p-1.5 bg-muted rounded-2xl border border-border">
        <button
          type="button"
          onClick={() => { setFormType('expense'); setErrorMsg(null); }}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            formType === 'expense'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-rose-500" />
          <span>I Spent Money (Expense Claim)</span>
        </button>

        <button
          type="button"
          onClick={() => { setFormType('income'); setErrorMsg(null); }}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            formType === 'income'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ArrowDownRight className="w-4 h-4 text-emerald-600" />
          <span>I Received Money (Deposit to Ledger)</span>
        </button>
      </div>

      <Card className="rounded-3xl border border-border shadow-md overflow-hidden bg-card">
        <CardHeader className="bg-muted/30 border-b border-border p-6 sm:p-8">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              formType === 'expense' ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'
            }`}>
              {formType === 'expense' ? <Receipt className="w-5 h-5" /> : <Coins className="w-5 h-5" />}
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                {formType === 'expense' ? 'Submit Expense Claim' : 'Deposit Collected Funds to Ledger'}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {formType === 'expense'
                  ? 'Request reimbursement for out-of-pocket expenses incurred for club activities.'
                  : 'Record cash, donations, or ticket takings you collected into the official club ledger.'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleReview} className="space-y-6">
            {errorMsg && (
              <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-xs font-semibold border border-destructive/20 flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* EXPENSE FORM FIELDS */}
            {formType === 'expense' ? (
              <>
                {/* Claim Title */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Claim Title *
                  </label>
                  <Input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Pizza & Drinks for Fresher Orientation"
                    className="h-11 rounded-xl text-sm font-medium"
                  />
                </div>

                {/* Amount & Spent Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Amount Spent (₹) *
                    </label>
                    <div className="relative">
                      <IndianRupee className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        min="1"
                        required
                        value={amountRupees}
                        onChange={(e) => setAmountRupees(e.target.value)}
                        placeholder="500.00"
                        className="h-11 pl-9 rounded-xl text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Date Incurred *
                    </label>
                    <Input
                      type="date"
                      required
                      value={spentOn}
                      onChange={(e) => setSpentOn(e.target.value)}
                      className="h-11 rounded-xl text-sm font-medium"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Detailed Reason & Justification *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what items were purchased and why they were necessary for the club..."
                    className="w-full p-3 rounded-xl border border-input bg-card text-sm font-medium outline-none focus:ring-2 focus:ring-primary shadow-xs"
                  />
                </div>

                {/* Related Activity */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Associated Activity
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setRelatedType('general')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        relatedType === 'general' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/40 border-border text-muted-foreground'
                      }`}
                    >
                      General Club
                    </button>
                    <button
                      type="button"
                      onClick={() => setRelatedType('event')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        relatedType === 'event' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/40 border-border text-muted-foreground'
                      }`}
                    >
                      Club Event
                    </button>
                    <button
                      type="button"
                      onClick={() => setRelatedType('fundraiser')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        relatedType === 'fundraiser' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/40 border-border text-muted-foreground'
                      }`}
                    >
                      Fundraiser
                    </button>
                  </div>

                  {relatedType === 'event' && events.length > 0 && (
                    <select
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-input bg-card text-sm font-medium outline-none focus:ring-2 focus:ring-primary"
                    >
                      {events.map((ev) => (
                        <option key={ev.id} value={ev.id}>{ev.title}</option>
                      ))}
                    </select>
                  )}

                  {relatedType === 'fundraiser' && fundraisers.length > 0 && (
                    <select
                      value={selectedFundraiserId}
                      onChange={(e) => setSelectedFundraiserId(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-input bg-card text-sm font-medium outline-none focus:ring-2 focus:ring-primary"
                    >
                      {fundraisers.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Receipts */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Receipt Proofs & URLs *
                    </label>
                    {receiptUrls.length < 5 && (
                      <button
                        type="button"
                        onClick={handleAddReceiptUrl}
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add URL
                      </button>
                    )}
                  </div>

                  {receiptUrls.map((url, idx) => (
                    <div key={idx} className="flex items-center gap-2 mb-2">
                      <div className="relative flex-1">
                        <LinkIcon className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                        <Input
                          type="url"
                          required
                          value={url}
                          onChange={(e) => handleReceiptChange(idx, e.target.value)}
                          placeholder="https://drive.google.com/file/d/... or image URL"
                          className="h-10 pl-9 rounded-xl text-xs font-mono"
                        />
                      </div>
                      {receiptUrls.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveReceiptUrl(idx)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <p className="text-[11px] text-muted-foreground">
                    Tip: Paste Google Drive (Anyone with link can view), Dropbox, or public photo links.
                  </p>
                </div>

                {/* Payee UPI ID */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Payee UPI ID (For Reimbursement Transfer)
                  </label>
                  <Input
                    type="text"
                    value={payeeUpiId}
                    onChange={(e) => setPayeeUpiId(e.target.value)}
                    placeholder="e.g. roshan@okhdfcbank or 9876543210@paytm"
                    className="h-11 rounded-xl text-sm font-medium"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Admins will transfer the approved reimbursement directly to this UPI address.
                  </p>
                </div>
              </>
            ) : (
              /* INCOME / TAKINGS SUBMISSION FORM */
              <>
                {/* Amount Collected */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Amount Received / Collected (₹) *
                  </label>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      value={amountRupees}
                      onChange={(e) => setAmountRupees(e.target.value)}
                      placeholder="1500.00"
                      className="h-11 pl-9 rounded-xl text-sm font-bold text-emerald-600"
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Collection Method *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setIncomeMethod('cash')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        incomeMethod === 'cash' ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 font-bold' : 'bg-muted/40 border-border text-muted-foreground'
                      }`}
                    >
                      💵 Physical Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => setIncomeMethod('upi_manual')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        incomeMethod === 'upi_manual' ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 font-bold' : 'bg-muted/40 border-border text-muted-foreground'
                      }`}
                    >
                      📱 UPI (Manual)
                    </button>
                    <button
                      type="button"
                      onClick={() => setIncomeMethod('bank')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        incomeMethod === 'bank' ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 font-bold' : 'bg-muted/40 border-border text-muted-foreground'
                      }`}
                    >
                      🏦 Direct Bank Transfer
                    </button>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Category of Funds *
                  </label>
                  <select
                    value={incomeCategory}
                    onChange={(e) => setIncomeCategory(e.target.value as any)}
                    className="w-full h-11 px-3 rounded-xl border border-input bg-card text-sm font-medium outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="fundraiser_income">Fundraiser Proceeds / Bake Sale / Stall Takings</option>
                    <option value="ticket_sales">Door / Offline Event Ticket Sales</option>
                    <option value="merch_sales">Offline Merchandise Cash</option>
                    <option value="manual_income">Donation / Student Contribution / Sponsorship</option>
                  </select>
                </div>

                {/* Related Activity */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Related Activity (Optional)
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setRelatedType('general')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        relatedType === 'general' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/40 border-border text-muted-foreground'
                      }`}
                    >
                      General Income
                    </button>
                    <button
                      type="button"
                      onClick={() => setRelatedType('fundraiser')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        relatedType === 'fundraiser' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/40 border-border text-muted-foreground'
                      }`}
                    >
                      Fundraiser
                    </button>
                    <button
                      type="button"
                      onClick={() => setRelatedType('event')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        relatedType === 'event' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/40 border-border text-muted-foreground'
                      }`}
                    >
                      Club Event
                    </button>
                  </div>

                  {relatedType === 'fundraiser' && fundraisers.length > 0 && (
                    <select
                      value={selectedFundraiserId}
                      onChange={(e) => setSelectedFundraiserId(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-input bg-card text-sm font-medium outline-none focus:ring-2 focus:ring-primary"
                    >
                      {fundraisers.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  )}

                  {relatedType === 'event' && events.length > 0 && (
                    <select
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-input bg-card text-sm font-medium outline-none focus:ring-2 focus:ring-primary"
                    >
                      {events.map((ev) => (
                        <option key={ev.id} value={ev.id}>{ev.title}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Source & Handover Description *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Cash collected from bake sale stall on Day 1. Handed over to treasurer Roshan."
                    className="w-full p-3 rounded-xl border border-input bg-card text-sm font-medium outline-none focus:ring-2 focus:ring-primary shadow-xs"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    State clearly where the funds originated and which student or admin was handed the physical cash or proof.
                  </p>
                </div>
              </>
            )}

            {/* Submit Button */}
            <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
              <Link href="/account/expenses">
                <Button type="button" variant="outline" className="rounded-xl">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={submitting}
                className={`rounded-xl px-7 font-semibold shadow-sm flex items-center gap-2 ${
                  formType === 'income'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                }`}
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Recording...
                  </>
                ) : formType === 'income' ? (
                  <>
                    <Coins className="w-4 h-4" /> Deposit to Ledger
                  </>
                ) : (
                  <>
                    <Receipt className="w-4 h-4" /> Submit Claim
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* CONFIRMATION POPUP MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in-0 duration-200">
          <div 
            className="bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2">
                {formType === 'expense' ? (
                  <Receipt className="w-5 h-5 text-primary" />
                ) : (
                  <Coins className="w-5 h-5 text-emerald-600" />
                )}
                <h3 className="text-base font-bold text-foreground">
                  {formType === 'expense' ? 'Confirm Expense Claim' : 'Confirm Ledger Deposit'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-4 bg-muted/40 rounded-xl border border-border flex items-center justify-between">
                <span className="font-bold text-muted-foreground uppercase tracking-wider text-[11px]">
                  {formType === 'expense' ? 'Total Claim Amount' : 'Total Deposit Amount'}
                </span>
                <span className="text-2xl font-black text-foreground">
                  ₹{parseFloat(amountRupees || '0').toFixed(2)}
                </span>
              </div>

              <div className="space-y-3 bg-card border border-border rounded-xl p-4">
                {formType === 'expense' ? (
                  <>
                    <div>
                      <span className="text-muted-foreground block font-medium">Expense Title:</span>
                      <span className="font-bold text-foreground text-sm">{title}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block font-medium">Date Incurred:</span>
                      <span className="font-semibold text-foreground">{spentOn}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block font-medium">Payee UPI ID:</span>
                      <span className="font-mono font-bold text-foreground">{payeeUpiId || 'None (Alternative payout)'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block font-medium">Receipts Attached:</span>
                      <div className="space-y-1 mt-1">
                        {receiptUrls.filter(Boolean).map((u, i) => (
                          <div key={i} className="text-primary truncate font-medium">
                            • {u}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-muted-foreground block font-medium">Collection Method:</span>
                      <span className="font-bold text-foreground uppercase">{incomeMethod}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block font-medium">Category:</span>
                      <span className="font-semibold text-foreground capitalize">{incomeCategory.replace(/_/g, ' ')}</span>
                    </div>
                  </>
                )}

                <div>
                  <span className="text-muted-foreground block font-medium">Related Project / Activity:</span>
                  <span className="font-semibold text-foreground">
                    {relatedType === 'event'
                      ? events.find((e) => e.id === selectedEventId)?.title || 'Selected Event'
                      : relatedType === 'fundraiser'
                      ? fundraisers.find((f) => f.id === selectedFundraiserId)?.name || 'Selected Fundraiser'
                      : 'General Student Association Operations'}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block font-medium">Description / Memo:</span>
                  <span className="text-foreground">{description}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-900 dark:text-amber-300 text-[11px] leading-relaxed">
                {formType === 'expense'
                  ? 'Please ensure all figures and bills match. Once confirmed, this claim will be queued for administrator review and reimbursed to your UPI.'
                  : 'Please confirm that the funds collected are physically accounted for and ready to be recorded in the official treasury ledger.'}
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-border bg-muted/30 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="rounded-xl text-xs"
              >
                Go Back & Edit
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleFinalSubmit}
                disabled={submitting}
                className={`rounded-xl text-xs font-semibold px-4 shadow-xs ${
                  formType === 'income'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                }`}
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> Submitting...
                  </>
                ) : (
                  'Yes, Confirm & Submit'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
