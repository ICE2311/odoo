'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ArrowRight, Sparkles, CheckCircle2, QrCode, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { getMembershipPageData, createPendingMembership } from './actions';
import Image from 'next/image';

interface MembershipData {
  user: { id: string; name: string; email: string };
  isActive: boolean;
  membership: { id: string; status: string; startsAt: string; endsAt: string; pricePaise: number } | null;
  daysRemaining: number;
  renewalDays: number;
  canBuyOrRenew: boolean;
  reasonCannotRenew: string | null;
  pricePaise: number;
  nextSeasonEnd: string;
  qrToken: string | null;
  qrDataUrl: string | null;
}

export default function MembershipPage() {
  const [data, setData] = useState<MembershipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await getMembershipPageData();
      setData(res as MembershipData);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load membership details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const ensureRazorpayLoaded = (): Promise<boolean> => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      return Promise.resolve(true);
    }
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePurchaseOrRenew = async () => {
    try {
      setPaying(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      // 1. Create a pending membership row
      const memId = await createPendingMembership();

      // 2. Create the checkout session
      const createRes = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose: 'membership', purposeId: memId }),
      });

      const checkoutData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(checkoutData.error || 'Failed to initialize payment');
      }

      // 3. Handle Development / Simulated Mode (when Razorpay keys are not yet configured)
      if (checkoutData.isSimulated) {
        const verifyRes = await fetch('/api/checkout/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rzOrderId: checkoutData.rzOrderId,
            rzPaymentId: 'pay_simulated_' + Date.now(),
            signature: 'simulated',
          }),
        });

        if (!verifyRes.ok) {
          const vData = await verifyRes.json();
          throw new Error(vData.error || 'Payment capture failed');
        }

        setSuccessMsg('🎉 Membership activated successfully! Welcome to Skyline SSA.');
        await loadData();
        return;
      }

      // 4. Live / Real Razorpay Checkout flow
      const scriptLoaded = await ensureRazorpayLoaded();
      if (!scriptLoaded || !(window as any).Razorpay) {
        throw new Error('Unable to load payment gateway. Please check your internet connection.');
      }

      const options = {
        key: checkoutData.keyId,
        amount: checkoutData.amount,
        currency: 'INR',
        name: 'Skyline Student Association',
        description: 'Membership Dues',
        order_id: checkoutData.rzOrderId,
        handler: async function (response: any) {
          try {
            setPaying(true);
            const verifyRes = await fetch('/api/checkout/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                rzOrderId: response.razorpay_order_id,
                rzPaymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              }),
            });

            if (!verifyRes.ok) {
              const vData = await verifyRes.json();
              throw new Error(vData.error || 'Payment verification failed');
            }

            setSuccessMsg('🎉 Payment successful! Your membership is now active.');
            await loadData();
          } catch (e: any) {
            setErrorMsg(e.message || 'Payment confirmation error');
          } finally {
            setPaying(false);
          }
        },
        prefill: {
          name: checkoutData.prefill?.name,
          email: checkoutData.prefill?.email,
        },
        theme: { color: '#6366f1' },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        setErrorMsg('Payment failed: ' + (resp.error?.description || 'Transaction cancelled'));
        setPaying(false);
      });
      rzp.open();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during checkout');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground font-medium">Loading your membership status...</p>
      </div>
    );
  }

  const priceFormatted = `₹${(data?.pricePaise ?? 50000) / 100}`;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Club Membership</h1>
        <p className="text-muted-foreground mt-1">
          Manage your student association membership, digital access card, and exclusive benefits.
        </p>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-medium text-sm">{errorMsg}</span>
        </div>
      )}

      {/* ─── ACTIVE MEMBERSHIP STATE: Show Digital Membership Card ─── */}
      {data?.isActive && data.membership && (
        <div className="space-y-6">
          {/* Digital Member Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white p-6 sm:p-8 shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full text-white/90 backdrop-blur-sm">
                    Official Member Pass
                  </span>
                  <Badge className="bg-emerald-400 text-emerald-950 hover:bg-emerald-400 font-bold border-none text-xs">
                    ACTIVE
                  </Badge>
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{data.user.name}</h2>
                  <p className="text-indigo-200 text-sm mt-0.5">{data.user.email}</p>
                </div>
                <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-indigo-100 pt-2 border-t border-white/10">
                  <div>
                    <span className="block text-indigo-300 text-xs">Valid Until</span>
                    <span className="font-semibold">
                      {new Date(data.membership.endsAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="block text-indigo-300 text-xs">Days Remaining</span>
                    <span className="font-semibold text-emerald-300">{data.daysRemaining} days</span>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              {data.qrDataUrl && (
                <div className="flex flex-col items-center bg-white p-3 rounded-xl shadow-md text-slate-900 shrink-0 self-center sm:self-auto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={data.qrDataUrl} alt="Member QR Code" className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg" />
                  <span className="text-[10px] font-semibold text-muted-foreground mt-1.5 uppercase tracking-wider flex items-center gap-1">
                    <QrCode className="w-3 h-3" /> Event Pass
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Renewal Status Notice / Action Card */}
          <Card className="rounded-xl border border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                Renewal & Validity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              {data.canBuyOrRenew ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                  <div className="font-semibold text-amber-950 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    Renewal Window Open!
                  </div>
                  <p className="text-xs sm:text-sm">
                    Your membership expires in <strong>{data.daysRemaining} days</strong>. Renew today for{' '}
                    <strong>{priceFormatted}</strong> to seamlessly extend your membership through{' '}
                    <strong>{data.nextSeasonEnd}</strong> without losing any days!
                  </p>
                  <Button
                    onClick={handlePurchaseOrRenew}
                    disabled={paying}
                    className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm"
                  >
                    {paying ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Processing...
                      </>
                    ) : (
                      <>Renew Membership ({priceFormatted})</>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 text-slate-700">
                  <p>{data.reasonCannotRenew}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── INACTIVE / GUEST STATE: Join Skyline Membership ─── */}
      {!data?.isActive && (
        <Card className="border-2 border-primary/20 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent pb-6 border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/15 rounded-xl text-primary shrink-0">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                      Skyline SSA Membership
                    </CardTitle>
                    <Badge variant="outline" className="border-primary/40 text-primary text-xs font-semibold">
                      Full Season
                    </Badge>
                  </div>
                  <CardDescription className="text-base text-muted-foreground mt-1">
                    Valid through {data?.nextSeasonEnd ?? 'end of academic year'}
                  </CardDescription>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-3xl font-extrabold text-foreground">{priceFormatted}</div>
                <div className="text-xs text-muted-foreground">annual club dues</div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-8 pb-6 space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-4 text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                What membership gets you:
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-muted-foreground">
                <li className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/50">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <span className="font-semibold text-foreground block text-sm">Discounted Event Tickets</span>
                    <span className="text-xs text-muted-foreground">Save on tickets for galas, formals & mixers.</span>
                  </div>
                </li>

                <li className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/50">
                  <div className="w-6 h-6 rounded-full bg-secondary/15 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-secondary" />
                  </div>
                  <div>
                    <span className="font-semibold text-foreground block text-sm">Exclusive Merch Access</span>
                    <span className="text-xs text-muted-foreground">Only members can buy official Skyline hoodies & gear.</span>
                  </div>
                </li>

                <li className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/50">
                  <div className="w-6 h-6 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <span className="font-semibold text-foreground block text-sm">Members-Only Announcements</span>
                    <span className="text-xs text-muted-foreground">Early updates, priority notices, and insider info.</span>
                  </div>
                </li>

                <li className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/50">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <span className="font-semibold text-foreground block text-sm">Volunteering & Expense Claims</span>
                    <span className="text-xs text-muted-foreground">Lead fundraisers and claim expense reimbursements.</span>
                  </div>
                </li>
              </ul>
            </div>
          </CardContent>

          <CardFooter className="bg-muted/20 pt-6 pb-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground text-center sm:text-left">
              Instant activation • Secure checkout via Razorpay • Digital card issued immediately
            </div>
            <Button
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md transition-all text-base flex items-center justify-center gap-2 shrink-0"
              onClick={handlePurchaseOrRenew}
              disabled={paying}
            >
              {paying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Become a Member — {priceFormatted}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
