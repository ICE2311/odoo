import { getPublicProducts } from '@/server/data/public/shop';
import { getCaller } from '@/server/auth/guards';
import Link from 'next/link';

export default async function ShopPage() {
  const products = await getPublicProducts();
  const caller = await getCaller();

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Merch Shop</h1>
      {caller.kind === 'visitor' && <p className="text-sm text-red-500 mb-4">Log in to buy (members only)</p>}
      {caller.kind === 'user' && !caller.isMember && <p className="text-sm text-red-500 mb-4">Merch is for members only — <Link href="/account/membership" className="underline">Become a member</Link></p>}
      
      <div className="grid grid-cols-2 gap-4">
        {products.map(p => (
          <Link href={`/shop/${p.slug}`} key={p.id} className="border p-2 rounded block">
            {p.imageUrls && p.imageUrls.length > 0 && <img src={p.imageUrls[0]} alt={p.name} className="w-full aspect-square object-cover mb-2" />}
            <h2 className="font-bold">{p.name}</h2>
            <p>₹{(p.basePricePaise / 100).toFixed(2)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
