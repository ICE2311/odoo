import { db } from '../../db';
import { products, productVariants } from '../../db/schema';
import { eq, and, or } from 'drizzle-orm';
import { getCaller } from '../../auth/guards';

export async function getPublicProducts() {
  const caller = await getCaller();
  // Admins see active and draft products; public sees active
  const statusCondition = caller.isAdmin
    ? or(eq(products.status, 'active'), eq(products.status, 'draft'))
    : eq(products.status, 'active');

  const allProducts = await db
    .select()
    .from(products)
    .where(statusCondition);

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

export async function getPublicProductBySlug(slugOrId: string) {
  const caller = await getCaller();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
  const matchCondition = isUuid
    ? or(eq(products.slug, slugOrId), eq(products.id, slugOrId))
    : eq(products.slug, slugOrId);

  const statusCondition = caller.isAdmin
    ? or(eq(products.status, 'active'), eq(products.status, 'draft'))
    : eq(products.status, 'active');

  const product = await db
    .select()
    .from(products)
    .where(and(matchCondition, statusCondition))
    .then((res) => res[0]);

  if (!product) return null;

  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, product.id));

  return { ...product, variants };
}

