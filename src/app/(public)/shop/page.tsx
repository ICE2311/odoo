import { getPublicProducts } from '@/server/data/public/shop';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ShoppingBag, Tag, Star } from 'lucide-react';

export default async function ShopPage() {
  const merch = await getPublicProducts();

  return (
    <div className="py-12 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">Skyline Shop</h1>
        <p className="text-lg text-muted-foreground">
          Show your pride with official Skyline Student Association merchandise.
        </p>
      </div>

      {merch.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-[var(--radius-xl)] border border-border shadow-sm">
          <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-foreground">Shop is empty</h3>
          <p className="text-muted-foreground">We're restocking. Come back soon!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {merch.map(item => (
            <Link key={item.id} href={`/shop/${item.slug || item.id}`} className="group outline-none block">
              <Card className="overflow-hidden border-border bg-card hover:border-primary/30 card-hover h-full flex flex-col transition-all">
                {item.imageUrls?.[0] ? (
                  <div className="aspect-[4/5] w-full bg-muted relative overflow-hidden">
                    <img src={item.imageUrls?.[0]} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" />
                    {(item.variants?.reduce((acc, v) => acc + v.stockOnHand, 0) || 0) === 0 && (
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
                    <span className={`font-semibold ${(item.variants?.reduce((acc, v) => acc + v.stockOnHand, 0) || 0) > 0 ? 'text-success' : 'text-destructive'}`}>
                      {(item.variants?.reduce((acc, v) => acc + v.stockOnHand, 0) || 0) > 0 ? `${(item.variants?.reduce((acc, v) => acc + v.stockOnHand, 0) || 0)} left` : 'Sold out'}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
