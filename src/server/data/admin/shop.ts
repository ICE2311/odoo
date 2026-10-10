import { db } from '../../db';
import { products, productVariants, merchOrders, merchOrderItems } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireAdmin } from '../../auth/guards';

export async function getAdminProducts() {
  await requireAdmin();
  
  const allProducts = await db.select().from(products).orderBy(desc(products.createdAt));
  const variants = await db.select().from(productVariants);
  
  return allProducts.map(p => ({
    ...p,
    variants: variants.filter(v => v.productId === p.id)
  }));
}

export async function getAdminProduct(id: string) {
  await requireAdmin();
  
  const [product] = await db.select().from(products).where(eq(products.id, id));
  if (!product) return null;
  const variants = await db.select().from(productVariants).where(eq(productVariants.productId, id));
  
  return { ...product, variants };
}

export async function getAdminOrders() {
  await requireAdmin();
  return await db.select().from(merchOrders).orderBy(desc(merchOrders.createdAt));
}
