'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, CheckCircle2, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { addToCartAction } from '@/server/actions/cart';

export interface VariantItem {
  id: string;
  label: string;
  sku: string;
  stockOnHand: number;
  stockHeld: number;
  priceOverridePaise?: number | null;
}

export interface AddToCartFormProps {
  productId: string;
  variants?: VariantItem[];
}

export function AddToCartForm({ productId, variants = [] }: AddToCartFormProps) {
  const router = useRouter();
  const safeVariants = Array.isArray(variants) ? variants : [];
  const availableVariants = safeVariants.filter(
    (v) => (v.stockOnHand || 0) - (v.stockHeld || 0) > 0
  );

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    availableVariants[0]?.id || safeVariants[0]?.id || ''
  );
  const [qty, setQty] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const selectedVariant = safeVariants.find((v) => v.id === selectedVariantId);
  const availableStock = selectedVariant
    ? Math.max(0, (selectedVariant.stockOnHand || 0) - (selectedVariant.stockHeld || 0))
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariantId) {
      setStatusMsg({ type: 'error', text: 'Please select an available variant.' });
      return;
    }
    setStatusMsg(null);

    startTransition(async () => {
      try {
        await addToCartAction(selectedVariantId, qty);
        setStatusMsg({ type: 'success', text: `Added ${qty} item(s) to your cart!` });
        router.refresh();
      } catch (err: any) {
        setStatusMsg({ type: 'error', text: err.message || 'Failed to add item to cart.' });
      }
    });
  };

  if (safeVariants.length === 0 || availableVariants.length === 0) {
    return (
      <div className="p-4 bg-muted/60 rounded-[var(--radius-lg)] text-center text-muted-foreground text-sm font-medium">
        This product is currently out of stock.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {statusMsg && (
        <div
          className={`p-3.5 rounded-[var(--radius-lg)] text-xs font-semibold flex items-center justify-between gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-success/10 text-success border border-success/20'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>

          {statusMsg.type === 'success' && (
            <Link
              href="/cart"
              className="inline-flex items-center gap-1 font-bold text-xs underline hover:opacity-80"
            >
              Go to Cart <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      )}

      {/* Variants Radio Grid */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Select Option / Size
        </label>
        <div className="flex flex-wrap gap-2.5">
          {safeVariants.map((v) => {
            const available = Math.max(0, (v.stockOnHand || 0) - (v.stockHeld || 0));
            const isAvailable = available > 0;
            const isSelected = selectedVariantId === v.id;

            return (
              <label
                key={v.id}
                className={`relative flex flex-col items-center justify-center p-3 rounded-[var(--radius-lg)] border min-w-[76px] cursor-pointer transition-all ${
                  !isAvailable
                    ? 'opacity-40 cursor-not-allowed bg-muted/50 border-border text-muted-foreground'
                    : isSelected
                    ? 'border-primary bg-primary/5 text-primary shadow-xs ring-1 ring-primary'
                    : 'border-border bg-card hover:border-primary/40 text-foreground'
                }`}
              >
                <input
                  type="radio"
                  name="variantId"
                  value={v.id}
                  disabled={!isAvailable}
                  checked={isSelected}
                  onChange={() => setSelectedVariantId(v.id)}
                  className="sr-only"
                />
                <span className="font-bold text-sm">{v.label}</span>
                <span
                  className={`text-[10px] uppercase tracking-wider font-bold mt-1 ${
                    !isAvailable
                      ? 'text-destructive'
                      : available <= 3
                      ? 'text-amber-600'
                      : 'text-success'
                  }`}
                >
                  {!isAvailable ? 'Sold out' : available <= 3 ? `${available} left` : 'In stock'}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Quantity & Submit */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Quantity:
          </label>
          <div className="flex items-center border border-border rounded-[var(--radius-md)] bg-card overflow-hidden">
            <button
              type="button"
              disabled={qty <= 1}
              onClick={() => setQty((prev) => Math.max(1, prev - 1))}
              className="px-3 py-1 text-sm font-bold text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors"
            >
              -
            </button>
            <span className="px-3 py-1 text-sm font-bold text-foreground font-mono">
              {qty}
            </span>
            <button
              type="button"
              disabled={qty >= availableStock}
              onClick={() => setQty((prev) => Math.min(availableStock, prev + 1))}
              className="px-3 py-1 text-sm font-bold text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors"
            >
              +
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || availableStock === 0}
          className="w-full py-3.5 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-[var(--radius-xl)] flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
        >
          {isPending ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Adding to Cart...
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" /> Add to Cart
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default AddToCartForm;

