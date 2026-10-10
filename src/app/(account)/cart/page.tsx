import { getMyCart } from '@/server/data/me/cart';
import { ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function CartPage() {
  const cart = await getMyCart();
  const total = (cart.totalPaise / 100).toFixed(2);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-8">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="p-2 bg-primary/10 rounded-[var(--radius-md)] text-primary">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Shopping Cart</h1>
      </div>

      {cart.items.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-[var(--radius-xl)] shadow-sm">
          <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold text-foreground mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Looks like you haven't added any merch yet.</p>
          <Link href="/shop" className="inline-block px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-[var(--radius-md)] hover:opacity-90 shadow-sm transition-opacity">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            {cart.items.map((item: any) => (
              <div key={item.variantId} className="flex gap-4 bg-card border border-border p-4 rounded-[var(--radius-xl)] shadow-sm items-center">
                <div className="w-20 h-20 bg-muted rounded-[var(--radius-md)] flex items-center justify-center overflow-hidden shrink-0">
                  <ShoppingBag className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground">{item.label}</h3>
                  <p className="text-sm text-muted-foreground mb-2">Unit Price: ₹{(item.unitPricePaise / 100).toFixed(2)}</p>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold border border-border rounded-[var(--radius-md)] bg-input px-4 py-1">
                      Qty: {item.qty}
                    </span>
                    <form action="/api/cart/remove" method="POST">
                      <input type="hidden" name="variantId" value={item.variantId} />
                      <button 
                        type="submit"
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-[var(--radius-md)] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                  {!item.inStock && (
                    <p className="text-xs text-destructive font-semibold mt-2">Not enough stock!</p>
                  )}
                </div>
                <div className="font-bold text-lg text-foreground pr-2">
                  ₹{(item.lineTotalPaise / 100).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="bg-card border border-border rounded-[var(--radius-xl)] p-6 shadow-sm sticky top-24">
              <h3 className="font-bold text-lg text-foreground border-b border-border pb-4 mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-medium text-foreground">₹{total}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax (0%)</span>
                  <span className="font-medium text-foreground">₹0</span>
                </div>
                <div className="border-t border-border pt-3 mt-3 flex justify-between font-bold text-lg text-foreground">
                  <span>Total</span>
                  <span className="text-primary">₹{total}</span>
                </div>
              </div>

              <form action="/api/checkout/cart" method="POST">
                <button 
                  type="submit"
                  className="w-full py-4 text-base font-bold bg-primary text-primary-foreground hover:opacity-90 rounded-[var(--radius-md)] flex items-center justify-center gap-2 shadow-sm transition-opacity"
                >
                  Checkout securely
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
              <div className="mt-4 text-center">
                <Link href="/shop" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
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
