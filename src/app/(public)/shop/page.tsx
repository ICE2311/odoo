import { getPublicProducts } from '@/server/data/public/shop';
import { expireStalePaymentHolds } from '@/server/services/holds';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ShoppingBag, Tag, Star } from 'lucide-react';

export default async function ShopPage() {
  // Proactively release any stale checkout holds before rendering stock counts
  await expireStalePaymentHolds().catch(() => {});
  const merch = await getPublicProducts();

  return (
    <div className="py-12 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">Skyline Shop</h1>
        <p className="text-lg text-muted-foreground">
          Show your pride with official Skyline Student Association merchandise.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 shadow-sm transition-opacity"
          >
            <ShoppingBag className="w-4 h-4" />
            View Cart
          </Link>
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-sm font-semibold shadow-sm transition-colors"
          >
            My Orders
          </Link>
        </div>
      </div>

      {merch.length === 0 ? (
        <div className="text-center py-16 bg-muted/40 rounded-[var(--radius-xl)] border border-border p-8">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
          <h3 className="text-xl font-bold mb-2">No Merch Available</h3>
          <p className="text-muted-foreground">We&apos;re restocking. Come back soon!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {merch.map(item => {
            const availableCount = item.variants?.reduce(
              (acc, v) => acc + Math.max(0, (v.stockOnHand || 0) - (v.stockHeld || 0)),
              0
            ) || 0;

            return (
              <Link key={item.id} href={`/shop/${item.slug || item.id}`} className="group outline-none block">
                <Card className="overflow-hidden border-border bg-card hover:border-primary/30 card-hover h-full flex flex-col">
                  {item.imageUrls?.[0] ? (
                    <div className="aspect-[4/5] w-full bg-muted relative overflow-hidden">
                      <img src={item.imageUrls?.[0]} alt={item.name} className="w-full h-full object-cover img-zoom" />
                      {availableCount === 0 && (
                        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
                          <span className="px-4 py-2 bg-background text-foreground font-bold rounded-full text-sm shadow-lg">Out of Stock</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-[4/5] w-full bg-muted relative overflow-hidden flex items-center justify-center">
                      <ShoppingBag className="w-16 h-16 text-muted-foreground/30" />
                    </div>
                  )}
                  
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <h3 className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors">{item.name}</h3>
                      <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-[var(--radius-md)] text-sm font-bold shrink-0">
                        ₹{(item.basePricePaise / 100).toFixed(2)}
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-1">
                      {item.description}
                    </p>
                    
                    <div className="pt-4 border-t border-border mt-auto flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 font-medium text-foreground/80">
                        <Tag className="w-4 h-4 text-secondary" />
                        View Options
                      </span>
                      <span className={`font-semibold ${availableCount > 0 ? 'text-success' : 'text-destructive'}`}>
                        {availableCount > 0 ? `${availableCount} left` : 'Sold out'}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
