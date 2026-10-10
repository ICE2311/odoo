import { db } from '../../db';
import { products, productVariants } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

export async function getPublicProducts() {
  const allProducts = await db.query.products.findMany({
    where: eq(products.status, 'active'),
    with: { variants: true },
    columns: {
      id: true,
      slug: true,
      name: true,
      description: true,
      imageUrls: true,
      basePricePaise: true,
      status: true,
    },
  });

  return allProducts;
}

export async function getPublicProductBySlug(slug: string) {
  const [product] = await db.select().from(products).where(and(eq(products.slug, slug), eq(products.status, 'active')));
  if (!product) return null;
  
  const variants = await db.select().from(productVariants).where(eq(productVariants.productId, product.id));
  
  return { ...product, variants };
}
