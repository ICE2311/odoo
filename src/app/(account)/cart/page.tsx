import { getMyCart } from '@/server/data/me/cart';
import { removeFromCartAction, updateCartQtyAction } from '@/server/actions/cart';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { formatPaise } from '@/lib/format';

export default async function CartPage() {
  const cart = await getMyCart();

  if (cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <PageHeader title="Shopping Cart" subtitle="Your cart is currently empty." />
        <EmptyState
          icon={ShoppingCart}
          title="Cart is empty"
          description="Start shopping to add items to your cart."
          action={
            <Link href="/shop" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
              Continue Shopping
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Shopping Cart" subtitle={`${cart.items.length} item${cart.items.length !== 1 ? 's' : ''} in your cart`} />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div key={item.variantId} className="border border-border bg-card rounded-lg p-4 flex gap-4 items-center justify-between">
              <div className="flex-1">
                <p className="font-semibold text-card-foreground">{item.label}</p>
                <p className="text-sm text-muted-foreground">{formatPaise(item.unitPricePaise)} each</p>
                {!item.inStock && <p className="text-xs text-destructive mt-1">Only {item.available} in stock</p>}
              </div>

              <div className="flex items-center gap-3">
                {/* Qty stepper */}
                <div className="flex items-center gap-2 border border-border rounded-lg bg-muted p-1">
                  <form action={async () => {
                    'use server';
                    await updateCartQtyAction(item.variantId, Math.max(1, item.qty - 1));
                  }}>
                    <button type="submit" className="p-1 hover:bg-background transition-colors disabled:opacity-50" disabled={item.qty <= 1} aria-label="Decrease quantity">
                      <Minus className="w-3 h-3" />
                    </button>
                  </form>
                  <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                  <form action={async () => {
                    'use server';
                    await updateCartQtyAction(item.variantId, item.qty + 1);
                  }}>
                    <button type="submit" className="p-1 hover:bg-background transition-colors disabled:opacity-50" disabled={!item.inStock} aria-label="Increase quantity">
                      <Plus className="w-3 h-3" />
                    </button>
                  </form>
                </div>

                <p className="text-sm font-semibold w-20 text-right">{formatPaise(item.lineTotalPaise)}</p>

                <form action={async () => {
                  'use server';
                  await removeFromCartAction(item.variantId);
                }}>
                  <button type="submit" className="p-1.5 text-muted-foreground hover:text-destructive transition-colors" aria-label="Remove from cart">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="border border-border bg-card rounded-lg p-6 h-fit">
          <h2 className="font-semibold text-lg mb-6">Order Summary</h2>

          <div className="space-y-3 pb-6 border-b border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPaise(cart.totalPaise)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-green-600">Free</span>
            </div>
          </div>

          <div className="flex justify-between text-lg font-semibold py-6">
            <span>Total</span>
            <span>{formatPaise(cart.totalPaise)}</span>
          </div>

          <Link href="/shop" className="block text-center text-sm text-primary hover:underline">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

