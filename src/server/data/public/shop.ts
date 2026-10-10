import { db } from '../../db';
import { products, productVariants } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

export async function getPublicProducts() {
  const allProducts = await db
    .select()
    .from(products)
    .where(eq(products.status, 'active'));

  // Fetch variants for each product
  const productsWithVariants = await Promise.all(
    allProducts.map(async (p) => {
      const variants = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.productId, p.id));
      return { ...p, variants };
    })
  );

  return productsWithVariants;
}

export async function getPublicProductBySlug(slug: string) {
  const product = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.status, 'active')))
    .then((res) => res[0]);

  if (!product) return null;

  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, product.id));

  return { ...product, variants };
}

