'use server';

import { db } from '@/server/db';
import { carts, cartItems, productVariants, products } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireMember } from '@/server/auth/guards';
import { createMerchCheckout } from '@/server/services/merch';

export async function addToCartAction(variantId: string, qty: number) {
  const caller = await requireMember();

  return await db.transaction(async (tx) => {
    // Get or create cart
    let cart = await tx.query.carts.findFirst({
      where: eq(carts.userId, caller.user.id),
    });

    if (!cart) {
      const [newCart] = await tx.insert(carts).values({ userId: caller.user.id }).returning();
      cart = newCart;
    }

    // Verify variant exists and has stock
    const variant = await tx.query.productVariants.findFirst({
      where: eq(productVariants.id, variantId),
      with: { product: true },
    });

    if (!variant) throw new Error('Variant not found');

    const available = variant.stockOnHand - variant.stockHeld;
    if (available < qty) throw new Error(`Only ${available} left in stock`);

    // Add or update cart item
    const existing = await tx.query.cartItems.findFirst({
      where: and(eq(cartItems.cartId, cart.id), eq(cartItems.variantId, variantId)),
    });

    if (existing) {
      await tx
        .update(cartItems)
        .set({ qty: existing.qty + qty })
        .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.variantId, variantId)));
    } else {
      await tx.insert(cartItems).values({
        cartId: cart.id,
        variantId,
        qty,
      });
    }

    return { success: true };
  });
}

export async function removeFromCartAction(variantId: string) {
  const caller = await requireMember();

  const cart = await db.query.carts.findFirst({
    where: eq(carts.userId, caller.user.id),
  });

  if (!cart) return { success: true };

  await db.delete(cartItems).where(and(eq(cartItems.cartId, cart.id), eq(cartItems.variantId, variantId)));

  return { success: true };
}

export async function updateCartQtyAction(variantId: string, newQty: number) {
  const caller = await requireMember();

  if (newQty <= 0) return removeFromCartAction(variantId);

  const cart = await db.query.carts.findFirst({
    where: eq(carts.userId, caller.user.id),
  });

  if (!cart) throw new Error('Cart not found');

  const variant = await db.query.productVariants.findFirst({
    where: eq(productVariants.id, variantId),
  });

  if (!variant) throw new Error('Variant not found');

  const available = variant.stockOnHand - variant.stockHeld;
  if (available < newQty) throw new Error(`Only ${available} left in stock`);

  await db
    .update(cartItems)
    .set({ qty: newQty })
    .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.variantId, variantId)));

  return { success: true };
}

export async function checkoutCartAction() {
  const caller = await requireMember();
  const { order, payment } = await createMerchCheckout(caller.user.id);
  return { orderId: order.id, paymentId: payment.id };
}
