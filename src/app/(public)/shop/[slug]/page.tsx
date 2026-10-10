import { getPublicProductBySlug } from '@/server/data/public/shop';
import { expireStalePaymentHolds } from '@/server/services/holds';
import { getCaller } from '@/server/auth/guards';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ShoppingBag, ArrowLeft, Tag, AlertTriangle } from 'lucide-react';
import { AddToCartForm } from '@/components/shop/add-to-cart-form';

export default async function ProductPage(props: { params: Promise<{ slug: string }> }) {
  await expireStalePaymentHolds().catch(() => {});
  const params = await props.params;
  const product = await getPublicProductBySlug((await params).slug);
  if (!product) return notFound();
  
  const caller = await getCaller();

  return (
    <div className="max-w-5xl mx-auto py-8 md:py-12 px-4 space-y-8">
      <Link href="/shop" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1.5 inline-block">
        <ArrowLeft className="w-4 h-4 inline" /> Back to Shop
      </Link>
      
      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-[var(--radius-xl)] shadow-sm overflow-hidden aspect-square flex items-center justify-center p-8">
            {product.imageUrls && product.imageUrls.length > 0 ? (
              <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover rounded-[var(--radius-md)]" />
            ) : (
              <ShoppingBag className="w-32 h-32 text-muted-foreground/20" />
            )}
          </div>
        </div>
        
        <div className="space-y-8 flex flex-col">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2 text-foreground">{product.name}</h1>
            <p className="text-3xl font-semibold text-primary mb-6 flex items-center gap-2">
              <Tag className="w-6 h-6 text-secondary" /> ₹{(product.basePricePaise / 100).toFixed(2)}
            </p>
            <div className="prose prose-blue text-muted-foreground leading-relaxed">
              {product.description}
            </div>
          </div>
          
          <div className="border border-border p-6 rounded-[var(--radius-xl)] bg-card shadow-sm mt-auto">
            <h3 className="font-bold text-lg mb-4 text-foreground">Select Variant</h3>
            
            {caller.kind === 'visitor' ? (
              <div className="p-4 bg-muted/50 rounded-[var(--radius-md)] border border-border text-center space-y-3">
                <p className="font-medium text-muted-foreground">Log in to view availability and purchase.</p>
                <Link href="/login" className="inline-block px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-[var(--radius-md)] hover:opacity-90">
                  Log in
                </Link>
              </div>
            ) : caller.kind === 'user' && !caller.isMember ? (
              <div className="p-4 bg-warning/10 border border-warning/20 rounded-[var(--radius-md)] text-center space-y-3">
                <AlertTriangle className="w-6 h-6 text-warning-foreground mx-auto" />
                <p className="font-semibold text-warning-foreground">Merch is exclusively for members.</p>
                <Link href="/account/membership" className="inline-block px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-[var(--radius-md)] hover:opacity-90">
                  Become a Member
                </Link>
              </div>
            ) : (
              <AddToCartForm productId={product.id} variants={product.variants} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
