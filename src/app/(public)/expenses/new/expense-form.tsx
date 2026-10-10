'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Receipt, Plus, Trash2, ArrowLeft, RefreshCw, 
  CheckCircle2, AlertCircle, HelpCircle, Link as LinkIcon 
} from 'lucide-react';
import Link from 'next/link';
import { submitClaimAction } from '@/server/actions/expenses';

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
}

export function ExpenseClaimForm({ events, fundraisers }: ExpenseClaimFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amountRupees, setAmountRupees] = useState('');
  const [spentOn, setSpentOn] = useState(new Date().toISOString().split('T')[0]);
  const [relatedType, setRelatedType] = useState<'event' | 'fundraiser' | 'general'>('general');
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '');
  const [selectedFundraiserId, setSelectedFundraiserId] = useState(fundraisers[0]?.id || '');
  const [receiptUrls, setReceiptUrls] = useState<string[]>(['https://drive.google.com/']);
  const [payeeUpiId, setPayeeUpiId] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsedRupees = parseFloat(amountRupees);
    if (isNaN(parsedRupees) || parsedRupees <= 0) {
      setErrorMsg('Please enter a valid positive amount.');
      return;
    }

    const cleanedUrls = receiptUrls.map(u => u.trim()).filter(Boolean);
    if (cleanedUrls.length === 0) {
      setErrorMsg('Please provide at least one valid receipt URL (e.g. Google Drive, Dropbox, or image link).');
      return;
    }

    try {
      setSubmitting(true);
      const amountPaise = Math.round(parsedRupees * 100);

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

      router.push('/expenses');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit claim. Please check your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      <Link
        href="/expenses"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Expense Claims
      </Link>

      <Card className="rounded-3xl border border-border shadow-md overflow-hidden bg-card">
        <CardHeader className="bg-muted/30 border-b border-border p-6 sm:p-8">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-foreground">
                Submit Expense & Ledger Claim
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Submit personal expenses incurred for club activities for reimbursement and ledger recording.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 space-y-6">
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-950 font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Claim Title / Purpose *
              </label>
              <Input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sugar, paper cups & decorations for Bake Sale"
                className="h-11 rounded-xl text-sm font-medium"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Detailed Description & Justification *
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what was purchased and why it was required for the club activity..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-input text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary resize-y"
              />
            </div>

            {/* Amount & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Amount Spent (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-sm">
                    ₹
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={amountRupees}
                    onChange={(e) => setAmountRupees(e.target.value)}
                    placeholder="450.00"
                    className="h-11 pl-8 rounded-xl text-sm font-semibold"
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

            {/* Related Event or Fundraiser */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Activity Allocation
              </label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setRelatedType('general')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    relatedType === 'general'
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-card text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  General Treasury
                </button>
                <button
                  type="button"
                  onClick={() => setRelatedType('event')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    relatedType === 'event'
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-card text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  Specific Event
                </button>
                <button
                  type="button"
                  onClick={() => setRelatedType('fundraiser')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    relatedType === 'fundraiser'
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-card text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  Fundraiser
                </button>
              </div>

              {relatedType === 'event' && (
                <div>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full border border-border bg-input text-foreground px-3.5 py-2.5 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary"
                  >
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {relatedType === 'fundraiser' && (
                <div>
                  <select
                    value={selectedFundraiserId}
                    onChange={(e) => setSelectedFundraiserId(e.target.value)}
                    className="w-full border border-border bg-input text-foreground px-3.5 py-2.5 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary"
                  >
                    {fundraisers.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Receipt URLs */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Receipt Links or Photos * (Max 5)
                </label>
                {receiptUrls.length < 5 && (
                  <button
                    type="button"
                    onClick={handleAddReceiptUrl}
                    className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Receipt Link
                  </button>
                )}
              </div>

              {receiptUrls.map((url, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
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
                      title="Remove URL"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <p className="text-[11px] text-muted-foreground">
                Tip: Paste Google Drive (set to &quot;Anyone with the link can view&quot;), Dropbox, or public photo links.
              </p>
            </div>

            {/* Payee UPI ID */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Payee UPI ID (For Reimbursement Payout)
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

            {/* Submit Button */}
            <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
              <Link href="/expenses">
                <Button type="button" variant="outline" className="rounded-xl">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-xl px-7 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Submitting...
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
    </div>
  );
}

