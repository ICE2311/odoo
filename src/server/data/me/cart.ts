import { db } from '@/server/db';
import { carts, cartItems, productVariants } from '@/server/db/schema';
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
      stockOnHand: productVariants.stockOnHand,
      stockHeld: productVariants.stockHeld,
      priceOverridePaise: productVariants.priceOverridePaise,
    })
    .from(cartItems)
    .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
    .where(eq(cartItems.cartId, cart.id));

  let totalPaise = 0;
  const lineItems = items.map((item) => {
    const available = item.stockOnHand - item.stockHeld;
    totalPaise += (item.priceOverridePaise ?? 0) * item.qty;
    return {
      variantId: item.variantId,
      label: item.label,
      qty: item.qty,
      unitPricePaise: item.priceOverridePaise ?? 0,
      lineTotalPaise: (item.priceOverridePaise ?? 0) * item.qty,
      available,
      inStock: available >= item.qty,
    };
  });

  return { id: cart.id, items: lineItems, totalPaise };
}

