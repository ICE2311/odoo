import { getPublicProducts } from '@/server/data/public/shop';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

export default async function ShopPage() {
  const products = await getPublicProducts();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Merch Shop</h1>
          <p className="text-gray-500 mt-1">Exclusive gear for active Skyline members.</p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-24 bg-gray-50 rounded-2xl border-2 border-dashed">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900">No products available</h3>
          <p className="text-gray-500">Check back later for new merch.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(p => (
            <Link key={p.id} href={`/shop/${p.slug}`} className="group border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all flex flex-col">
              <div className="aspect-square w-full bg-gray-100 overflow-hidden relative">
                {p.imageUrls && p.imageUrls.length > 0 ? (
                  <img src={p.imageUrls[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ShoppingBag className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute bottom-2 left-2 right-2 flex gap-1 overflow-x-auto hide-scrollbar">
                  {p.variants.map((v) => {
                    const available = v.stockOnHand - v.stockHeld;
                    return (
                      <span key={v.id} className={`text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap ${available > 0 ? 'bg-white text-gray-800' : 'bg-gray-800 text-gray-300 opacity-80 line-through'}`}>
                        {v.label}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h2 className="text-sm font-bold group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight flex-1">{p.name}</h2>
                <div className="mt-3 font-bold text-gray-900">
                  ₹{(p.basePricePaise / 100).toFixed(2)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
