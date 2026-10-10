import { getPublicProductBySlug } from '@/server/data/public/shop';
import { getCaller } from '@/server/auth/guards';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function ProductPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const product = await getPublicProductBySlug(params.slug);
  if (!product) return notFound();
  
  const caller = await getCaller();

  return (
    <div className="p-4 max-w-md mx-auto">
      <Link href="/shop" className="text-sm underline mb-4 inline-block">&larr; Back to Shop</Link>
      {product.imageUrls && product.imageUrls.length > 0 && <img src={product.imageUrls[0]} alt={product.name} className="w-full aspect-square object-cover mb-4 rounded" />}
      <h1 className="text-2xl font-bold">{product.name}</h1>
      <p className="text-xl mb-4">₹{(product.basePricePaise / 100).toFixed(2)}</p>
      <p className="mb-4">{product.description}</p>
      
      <div className="border p-4 rounded bg-gray-50">
        <h3 className="font-bold mb-2">Sizes</h3>
        <div className="flex gap-2 mb-4">
          {product.variants.map(v => {
            const available = v.stockOnHand - v.stockHeld;
            return (
              <div key={v.id} className="border p-2 rounded text-center">
                <div className="font-bold">{v.label}</div>
                <div className="text-xs text-gray-500">{available > 0 ? (available <= 3 ? `Only ${available} left` : 'In stock') : 'Sold out'}</div>
              </div>
            );
          })}
        </div>
        
        {caller.kind === 'visitor' && <p>Log in to buy (members only)</p>}
        {caller.kind === 'user' && !caller.isMember && <p>Merch is for members only — <Link href="/account/membership" className="underline">Become a member</Link></p>}
        {caller.kind === 'user' && caller.isMember && (
          <form method="POST" action="/api/cart/add">
            {/* Minimal form for now */}
            <input type="hidden" name="productId" value={product.id} />
            <button className="bg-black text-white w-full p-2 rounded">Add to cart</button>
          </form>
        )}
      </div>
    </div>
  );
}
