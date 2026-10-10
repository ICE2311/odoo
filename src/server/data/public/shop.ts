import { db } from '../../db';
import { products, productVariants } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

export async function getPublicProducts() {
  const allProducts = await db.query.products.findMany({
    where: eq(products.status, 'active'),
    with: { variants: true },
  });

  return allProducts;
}

export async function getPublicProductBySlug(slug: string) {
  const product = await db.query.products.findFirst({
    where: and(eq(products.slug, slug), eq(products.status, 'active')),
    with: { variants: true },
  });

  return product || null;
}
