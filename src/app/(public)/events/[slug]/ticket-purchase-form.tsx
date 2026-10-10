'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Ticket,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { formatPaise } from '@/lib/format';
import { buyTicketAction } from '@/server/actions/tickets';

interface TicketPurchaseProps {
  eventId: string;
  memberPricePaise: number;
  nonMemberPricePaise: number;
  maxTicketsPerUser: number;
  availableSeats: number;
  isMember: boolean;
  canBuy: boolean;
  buttonLabel: string;
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
}: TicketPurchaseProps) {
  const router = useRouter();
  const maxAllowed = Math.min(maxTicketsPerUser, Math.max(availableSeats, 1));
  const [qty, setQty] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Compute total
  let totalPaise = 0;
  if (isMember) {
    totalPaise += memberPricePaise;
    if (qty > 1) {
      totalPaise += nonMemberPricePaise * (qty - 1);
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

  const handlePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canBuy) return;
    setErrorMsg(null);

    startTransition(async () => {
      try {
        await buyTicketAction(eventId, qty);
        router.push('/account/tickets');
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to complete ticket order');
      }
    });
  };

  return (
    <form onSubmit={handlePurchase} className="space-y-4">
      {errorMsg && (
        <div className="p-3 rounded-[var(--radius-md)] bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
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
            disabled={qty <= 1 || !canBuy || isPending}
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
            disabled={!canBuy || isPending}
            onChange={(e) => {
              const val = parseInt(e.target.value || '1', 10);
              if (val >= 1 && val <= maxAllowed) setQty(val);
            }}
            className="flex-1 h-10 text-center font-bold text-base border rounded-[var(--radius-md)] bg-card text-foreground outline-none focus:ring-2 focus:ring-primary"
          />

          <button
            type="button"
            disabled={qty >= maxAllowed || !canBuy || isPending}
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
            Member rate applied ({formatPaise(memberPricePaise)}
            {qty > 1 ? ` + ${qty - 1} × ${formatPaise(nonMemberPricePaise)}` : ''})
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground">
            Standard ticket rate ({qty} × {formatPaise(nonMemberPricePaise)})
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!canBuy || isPending}
        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-3 rounded-[var(--radius-md)] hover:bg-primary/90 shadow-sm transition-all disabled:opacity-50 text-sm"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Securing Your Tickets...
          </>
        ) : (
          <>
            <Ticket className="w-4 h-4" />
            {canBuy ? `Confirm & Buy (${formatPaise(totalPaise)})` : buttonLabel}
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
        <ShieldCheck className="w-3.5 h-3.5 text-success" /> Instant digital QR pass issued to your account
      </div>
    </form>
  );
}

