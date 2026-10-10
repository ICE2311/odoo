'use server';

import { db } from '@/server/db';
import { carts, cartItems, productVariants } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireUser } from '@/server/auth/guards';
import { createMerchCheckout } from '@/server/services/merch';
import { revalidatePath } from 'next/cache';

export async function addToCartAction(variantId: string, qty: number) {
  const caller = await requireUser();
  if (!caller.isMember && !caller.isAdmin) {
    throw new Error('Active membership required to purchase merchandise');
  }

  const result = await db.transaction(async (tx) => {
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

  revalidatePath('/cart');
  return result;
}

export async function removeFromCartAction(variantId: string) {
  const caller = await requireUser();

  const cart = await db.query.carts.findFirst({
    where: eq(carts.userId, caller.user.id),
  });

  if (!cart) return { success: true };

  await db.delete(cartItems).where(and(eq(cartItems.cartId, cart.id), eq(cartItems.variantId, variantId)));

  revalidatePath('/cart');
  return { success: true };
}

export async function updateCartQtyAction(variantId: string, newQty: number) {
  const caller = await requireUser();

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

  revalidatePath('/cart');
  return { success: true };
}

export async function checkoutCartAction() {
  const caller = await requireUser();
  if (!caller.isMember && !caller.isAdmin) {
    throw new Error('Active membership required to purchase merchandise');
  }
  const { order, payment } = await createMerchCheckout(caller.user.id);
  revalidatePath('/cart');
  revalidatePath('/account/orders');
  return { orderId: order.id, paymentId: payment.id };
}
