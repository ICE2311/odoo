'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Ticket,
  Plus,
  Minus,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Loader2,
  CreditCard,
  Zap,
} from 'lucide-react';
import { formatPaise } from '@/lib/format';
import {
  createTicketCheckoutAction,
  confirmTicketPaymentAction,
} from '@/server/actions/tickets';

interface TicketPurchaseProps {
  eventId: string;
  memberPricePaise: number;
  nonMemberPricePaise: number;
  maxTicketsPerUser: number;
  availableSeats: number;
  isMember: boolean;
  canBuy: boolean;
  buttonLabel: string;
  membersOnly?: boolean;
}

export function TicketPurchaseForm({
  eventId,
  memberPricePaise,
  nonMemberPricePaise,
  maxTicketsPerUser,
  availableSeats,
  isMember,
  canBuy,
  buttonLabel,
  membersOnly = false,
}: TicketPurchaseProps) {
  const router = useRouter();
  const maxAllowed = Math.min(maxTicketsPerUser, Math.max(availableSeats, 1));
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [checkoutInfo, setCheckoutInfo] = useState<string | null>(null);

  // Compute total
  let totalPaise = 0;
  if (isMember) {
    if (membersOnly) {
      totalPaise += memberPricePaise * qty;
    } else {
      totalPaise += memberPricePaise;
      if (qty > 1) {
        totalPaise += nonMemberPricePaise * (qty - 1);
      }
    }
  } else {
    totalPaise += nonMemberPricePaise * qty;
  }

  const handleQtyChange = (delta: number) => {
    const next = qty + delta;
    if (next >= 1 && next <= maxAllowed) {
      setQty(next);
      setErrorMsg(null);
    }
  };

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

  // 1. Pay with Razorpay Gateway
  const handleRazorpayPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canBuy || loading || demoLoading) return;
    setLoading(true);
    setErrorMsg(null);
    setCheckoutInfo(null);

    try {
      const checkout = await createTicketCheckoutAction(eventId, qty);
      if (!checkout.success) throw new Error('Failed to create ticket order');

      // If simulated mode is enabled
      if (checkout.isSimulated) {
        await confirmTicketPaymentAction(
          checkout.orderId,
          checkout.rzOrderId,
          `pay_sim_${Date.now()}`
        );
        router.push('/account/tickets?success=1');
        router.refresh();
        return;
      }

      // Live / Test Razorpay checkout flow
      const scriptLoaded = await ensureRazorpayLoaded();
      if (!scriptLoaded || !(window as any).Razorpay) {
        throw new Error('Could not load Razorpay gateway. Please check your internet connection.');
      }

      const options = {
        key: checkout.keyId,
        amount: checkout.amountPaise,
        currency: 'INR',
        name: 'Skyline Student Association',
        description: `Event Tickets (${qty} ticket${qty > 1 ? 's' : ''})`,
        order_id: checkout.rzOrderId,
        prefill: checkout.prefill,
        handler: async function (response: any) {
          try {
            setLoading(true);
            await confirmTicketPaymentAction(
              checkout.orderId,
              response.razorpay_order_id,
              response.razorpay_payment_id
            );
            router.push('/account/tickets?success=1');
            router.refresh();
          } catch (err: any) {
            setErrorMsg(err.message || 'Payment confirmation failed');
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setCheckoutInfo(
              "Razorpay was closed or showed 'Contact site owner'. If your Razorpay merchant account KYC is pending, you can complete your ticket order instantly using the 'Instant Demo Payment' button below."
            );
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        setErrorMsg(resp.error?.description || 'Payment failed on gateway');
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment failed to initialize');
      setLoading(false);
    }
  };

  // 2. Instant Demo / Test Payment (Bypasses unactivated Razorpay accounts)
  const handleInstantDemoPayment = async () => {
    if (!canBuy || loading || demoLoading) return;
    setDemoLoading(true);
    setErrorMsg(null);
    setCheckoutInfo(null);

    try {
      const checkout = await createTicketCheckoutAction(eventId, qty);
      await confirmTicketPaymentAction(
        checkout.orderId,
        checkout.rzOrderId,
        `pay_demo_${Date.now()}`
      );
      router.push('/account/tickets?success=1');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo payment failed');
      setDemoLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="p-3 rounded-[var(--radius-md)] bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {checkoutInfo && (
        <div className="p-3 rounded-[var(--radius-md)] bg-amber-50 text-amber-900 text-xs font-medium border border-amber-200">
          {checkoutInfo}
        </div>
      )}

      {/* Quantity Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between">
          <span>Number of Tickets</span>
          <span className="text-[11px] font-normal text-muted-foreground">
            (Max {maxAllowed})
          </span>
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={qty <= 1 || !canBuy || loading || demoLoading}
            onClick={() => handleQtyChange(-1)}
            className="w-10 h-10 rounded-[var(--radius-md)] border bg-card hover:bg-muted font-bold flex items-center justify-center disabled:opacity-30 transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>

          <input
            type="number"
            min="1"
            max={maxAllowed}
            value={qty}
            disabled={!canBuy || loading || demoLoading}
            onChange={(e) => {
              const val = parseInt(e.target.value || '1', 10);
              if (val >= 1 && val <= maxAllowed) setQty(val);
            }}
            className="flex-1 h-10 text-center font-bold text-base border rounded-[var(--radius-md)] bg-card text-foreground outline-none focus:ring-2 focus:ring-primary"
          />

          <button
            type="button"
            disabled={qty >= maxAllowed || !canBuy || loading || demoLoading}
            onClick={() => handleQtyChange(1)}
            className="w-10 h-10 rounded-[var(--radius-md)] border bg-card hover:bg-muted font-bold flex items-center justify-center disabled:opacity-30 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Order Pricing Breakdown */}
      <div className="p-3.5 bg-muted/50 border rounded-[var(--radius-lg)] space-y-1.5 text-xs">
        <div className="flex justify-between items-center text-foreground font-semibold">
          <span>Total Payable</span>
          <span className="text-base font-bold text-primary">{formatPaise(totalPaise)}</span>
        </div>

        {isMember ? (
          <div className="text-[11px] text-success flex items-center gap-1 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            {membersOnly 
              ? `Exclusive member rate applied (${formatPaise(memberPricePaise)} × ${qty})`
              : `Member rate applied (${formatPaise(memberPricePaise)}${qty > 1 ? ` + ${qty - 1} × ${formatPaise(nonMemberPricePaise)}` : ''})`}
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground">
            Standard ticket rate ({qty} × {formatPaise(nonMemberPricePaise)})
          </div>
        )}
      </div>

      {/* Payment Action Buttons */}
      <div className="space-y-2 pt-1">
        <button
          type="button"
          disabled={!canBuy || loading || demoLoading}
          onClick={handleRazorpayPayment}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-3 rounded-[var(--radius-md)] hover:opacity-90 shadow-sm transition-all disabled:opacity-50 text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Opening Gateway...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              {canBuy ? `Pay ${formatPaise(totalPaise)} with Razorpay` : buttonLabel}
            </>
          )}
        </button>

        {canBuy && (
          <button
            type="button"
            disabled={loading || demoLoading}
            onClick={handleInstantDemoPayment}
            title="Use this to bypass Razorpay unactivated merchant or KYC errors"
            className="w-full flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground font-semibold px-4 py-2.5 rounded-[var(--radius-md)] border border-border transition-colors disabled:opacity-50 text-xs"
          >
            {demoLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Issuing Tickets...
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Instant Demo Payment ({formatPaise(totalPaise)})
              </>
            )}
          </button>
        )}
      </div>

      <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-success" /> Instant digital QR pass issued to your account
      </div>
    </div>
  );
}
