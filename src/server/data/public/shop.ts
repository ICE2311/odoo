import { db } from '../../db';
import { products, productVariants } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

export async function getPublicProducts() {
  const allProducts = await db.select({
    id: products.id,
    slug: products.slug,
    name: products.name,
    description: products.description,
    imageUrls: products.imageUrls,
    basePricePaise: products.basePricePaise,
    status: products.status
  }).from(products).where(eq(products.status, 'active'));
  
  return allProducts;
}

export async function getPublicProductBySlug(slug: string) {
  const [product] = await db.select().from(products).where(and(eq(products.slug, slug), eq(products.status, 'active')));
  if (!product) return null;
  
  const variants = await db.select().from(productVariants).where(eq(productVariants.productId, product.id));
  
  return { ...product, variants };
}
