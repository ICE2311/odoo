'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Trash2, Plus, Minus, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface CartItemRowProps {
  item: {
    variantId: string;
    label: string;
    productName: string;
    productSlug?: string | null;
    image?: string | null;
    variantLabel: string;
    qty: number;
    unitPricePaise: number;
    lineTotalPaise: number;
    available: number;
    inStock: boolean;
  };
}

export function CartItemRow({ item }: CartItemRowProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateQty = async (newQty: number) => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      if (newQty <= 0) {
        await handleRemove();
        return;
      }

      const res = await fetch('/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId: item.variantId, qty: newQty }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update quantity');

      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to update quantity');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId: item.variantId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove item');

      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to remove item');
      setLoading(false);
    }
  };

  const unitPrice = (item.unitPricePaise / 100).toFixed(2);
  const lineTotal = (item.lineTotalPaise / 100).toFixed(2);

  return (
    <div className="flex flex-col sm:flex-row gap-4 bg-card border border-border p-4 rounded-[var(--radius-xl)] shadow-sm items-start sm:items-center relative">
      {/* Thumbnail */}
      <div className="w-20 h-20 bg-muted rounded-[var(--radius-md)] flex items-center justify-center overflow-hidden shrink-0 border border-border">
        {item.image ? (
          <img
            src={item.image}
            alt={item.productName || item.label}
            className="w-full h-full object-cover"
          />
        ) : (
          <ShoppingBag className="w-8 h-8 text-muted-foreground/30" />
        )}
      </div>

      {/* Info & Quantity */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/shop/${item.productSlug || item.variantId}`}
          className="font-bold text-foreground hover:text-primary transition-colors block truncate"
        >
          {item.productName || item.label}
        </Link>
        <div className="flex items-center gap-2 mt-0.5 mb-2">
          <span className="text-xs bg-muted border border-border px-2 py-0.5 rounded font-medium text-muted-foreground">
            Size / Variant: {item.variantLabel}
          </span>
          <span className="text-xs text-muted-foreground">
            ₹{unitPrice} each
          </span>
        </div>

        {/* Quantity Controls & Remove */}
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-border rounded-[var(--radius-md)] bg-muted/40 overflow-hidden">
            <button
              type="button"
              onClick={() => handleUpdateQty(item.qty - 1)}
              disabled={loading}
              title="Decrease quantity"
              className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-3 text-sm font-semibold min-w-[2rem] text-center">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto text-primary" /> : item.qty}
            </span>
            <button
              type="button"
              onClick={() => handleUpdateQty(item.qty + 1)}
              disabled={loading || item.qty >= item.available}
              title={item.qty >= item.available ? 'Max stock reached' : 'Increase quantity'}
              className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            disabled={loading}
            title="Remove item"
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-[var(--radius-md)] transition-colors disabled:opacity-40"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {!item.inStock && (
          <p className="text-xs text-destructive font-semibold mt-2">
            Not enough stock! ({item.available} available)
          </p>
        )}

        {error && (
          <p className="text-xs text-destructive font-medium mt-1">
            {error}
          </p>
        )}
      </div>

      {/* Line Total */}
      <div className="font-bold text-lg text-foreground pr-2 shrink-0 self-end sm:self-center">
        ₹{lineTotal}
      </div>
    </div>
  );
}

