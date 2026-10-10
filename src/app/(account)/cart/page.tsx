import { getMyCart } from '@/server/data/me/cart';
import { ShoppingBag, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { CartCheckoutButton } from '@/components/shop/cart-checkout-button';
import { CartItemRow } from '@/components/shop/cart-item-row';

interface CartPageProps {
  searchParams?: Promise<{ error?: string }>;
}

export default async function CartPage(props: CartPageProps) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const errorParam = searchParams?.error;

  const cart = await getMyCart();
  const total = (cart.totalPaise / 100).toFixed(2);
  const hasOutOfStock = cart.items.some((item) => !item.inStock);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-8 px-4 sm:px-6">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="p-2 bg-primary/10 rounded-[var(--radius-md)] text-primary">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Shopping Cart</h1>
      </div>

      {errorParam && (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-[var(--radius-md)] text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{decodeURIComponent(errorParam)}</span>
        </div>
      )}

      {cart.items.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-[var(--radius-xl)] shadow-sm">
          <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold text-foreground mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Looks like you haven't added any merch yet.</p>
          <Link
            href="/shop"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-[var(--radius-md)] hover:opacity-90 shadow-sm transition-opacity"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <CartItemRow key={item.variantId} item={item} />
            ))}
          </div>

          <div className="space-y-4">
            <div className="bg-card border border-border rounded-[var(--radius-xl)] p-6 shadow-sm sticky top-24">
              <h3 className="font-bold text-lg text-foreground border-b border-border pb-4 mb-4">
                Order Summary
              </h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-medium text-foreground">₹{total}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax (0%)</span>
                  <span className="font-medium text-foreground">₹0.00</span>
                </div>
                <div className="border-t border-border pt-3 mt-3 flex justify-between font-bold text-lg text-foreground">
                  <span>Total</span>
                  <span className="text-primary">₹{total}</span>
                </div>
              </div>

              <CartCheckoutButton
                hasItems={cart.items.length > 0}
                hasOutOfStock={hasOutOfStock}
              />

              <div className="mt-4 text-center">
                <Link
                  href="/shop"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
