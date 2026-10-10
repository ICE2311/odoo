import { db } from '@/server/db';
import { carts, cartItems, productVariants, products } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { requireUser } from '@/server/auth/guards';

export async function getMyCart() {
  const caller = await requireUser();

  const cart = await db.query.carts.findFirst({
    where: eq(carts.userId, caller.user.id),
  });

  if (!cart) {
    return { id: '', items: [], totalPaise: 0 };
  }

  const items = await db
    .select({
      cartId: cartItems.cartId,
      variantId: cartItems.variantId,
      qty: cartItems.qty,
      label: productVariants.label,
      productName: products.name,
      productSlug: products.slug,
      imageUrls: products.imageUrls,
      stockOnHand: productVariants.stockOnHand,
      stockHeld: productVariants.stockHeld,
      priceOverridePaise: productVariants.priceOverridePaise,
      basePricePaise: products.basePricePaise,
    })
    .from(cartItems)
    .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(eq(cartItems.cartId, cart.id));

  let totalPaise = 0;
  const lineItems = items.map((item) => {
    const available = item.stockOnHand - item.stockHeld;
    const unitPricePaise = item.priceOverridePaise ?? item.basePricePaise ?? 0;
    const lineTotalPaise = unitPricePaise * item.qty;
    totalPaise += lineTotalPaise;
    return {
      variantId: item.variantId,
      label: `${item.productName} (${item.label})`,
      productName: item.productName,
      productSlug: item.productSlug,
      image: item.imageUrls?.[0] || null,
      variantLabel: item.label,
      qty: item.qty,
      unitPricePaise,
      lineTotalPaise,
      available,
      inStock: available >= item.qty,
    };
  });

  return { id: cart.id, items: lineItems, totalPaise };
}
