import { getPublicProducts } from '@/server/data/public/shop';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { formatPaise } from '@/lib/format';

interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrls: string[] | null;
  basePricePaise: number;
  status: 'active' | 'draft' | 'archived';
  variants: Array<{
    id: string;
    label: string;
    stockOnHand: number;
    stockHeld: number;
  }>;
}

export default async function ShopPage() {
  const products = await getPublicProducts();

  if (products.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <PageHeader
          title="Merch Shop"
          subtitle="Exclusive gear for active Skyline members."
        />
        <EmptyState
          icon={ShoppingBag}
          title="No products available"
          description="Check back later for new merch."
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <PageHeader
        title="Merch Shop"
        subtitle="Exclusive gear for active Skyline members."
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {(products as Product[]).map((p) => (
          <Link
            key={p.id}
            href={`/shop/${p.slug}`}
            className="group border border-border rounded-lg overflow-hidden bg-card shadow-sm hover:shadow-md transition-all flex flex-col"
          >
            <div className="aspect-square w-full bg-muted overflow-hidden relative">
              {p.imageUrls && p.imageUrls.length > 0 ? (
                <img
                  src={p.imageUrls[0]}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ShoppingBag className="w-12 h-12" />
                </div>
              )}
              <div className="absolute bottom-2 left-2 right-2 flex gap-1 overflow-x-auto hide-scrollbar">
                {p.variants?.map((v) => {
                  const available = v.stockOnHand - v.stockHeld;
                  return (
                    <span
                      key={v.id}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap ${
                        available > 0
                          ? 'bg-card text-card-foreground'
                          : 'bg-muted text-muted-foreground opacity-80 line-through'
                      }`}
                    >
                      {v.label}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <h2 className="text-sm font-bold group-hover:text-primary transition-colors line-clamp-2 leading-tight flex-1">
                {p.name}
              </h2>
              <div className="mt-3 font-bold text-card-foreground">
                {formatPaise(p.basePricePaise)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

