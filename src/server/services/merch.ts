import { db } from '../db';
import { products, productVariants, carts, cartItems, merchOrders, merchOrderItems, payments } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { requireMember } from '../auth/guards';

export async function addVariantToCart(userId: string, variantId: string, qty: number) {
  const caller = await requireMember();
  if (caller.user.id !== userId) throw new Error("Unauthorized");
  
  return await db.transaction(async (tx) => {
    let cart = await tx.select().from(carts).where(eq(carts.userId, userId)).then(res => res[0]);
    if (!cart) {
      const [newCart] = await tx.insert(carts).values({ userId }).returning();
      cart = newCart;
    }
    
    // Check stock
    const [variant] = await tx.select().from(productVariants).where(eq(productVariants.id, variantId));
    if (!variant) throw new Error("Variant not found");
    
    const available = variant.stockOnHand - variant.stockHeld;
    if (available < qty) throw new Error(`Only ${available} left in stock`);

    // UPSERT cart item
    await tx.insert(cartItems)
      .values({ cartId: cart.id, variantId, qty })
      .onConflictDoUpdate({
        target: [cartItems.cartId, cartItems.variantId],
        set: { qty: sql`${cartItems.qty} + ${qty}` }
      });
      
    await tx.update(carts).set({ updatedAt: sql`now()` }).where(eq(carts.id, cart.id));
  });
}

export async function createMerchCheckout(userId: string) {
  const caller = await requireMember();
  if (caller.user.id !== userId) throw new Error("Unauthorized");
  
  return await db.transaction(async (tx) => {
    const [cart] = await tx.select().from(carts).where(eq(carts.userId, userId));
    if (!cart) throw new Error("Cart empty");
    
    const items = await tx.select({
      variantId: cartItems.variantId,
      qty: cartItems.qty,
      price: sql<number>`COALESCE(${productVariants.priceOverridePaise}, ${products.basePricePaise})`,
      name: products.name,
      label: productVariants.label,
      stockOnHand: productVariants.stockOnHand,
      stockHeld: productVariants.stockHeld
    })
    .from(cartItems)
    .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(eq(cartItems.cartId, cart.id));
    
    if (items.length === 0) throw new Error("Cart empty");
    
    let totalPaise = 0;
    for (const item of items) {
      if (item.stockOnHand - item.stockHeld < item.qty) {
        throw new Error(`Variant ${item.label} of ${item.name} is out of stock`);
      }
      totalPaise += item.price * item.qty;
    }
    
    const orderNumber = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const [order] = await tx.insert(merchOrders).values({
      userId,
      orderNumber,
      totalPaise,
      status: 'pending_payment'
    }).returning();
    
    for (const item of items) {
      await tx.insert(merchOrderItems).values({
        orderId: order.id,
        variantId: item.variantId,
        productName: item.name,
        variantLabel: item.label,
        unitPricePaise: item.price,
        qty: item.qty
      });
      
      const res = await tx.execute(
        sql`UPDATE product_variants SET stock_held = stock_held + ${item.qty} WHERE id = ${item.variantId} AND stock_on_hand - stock_held >= ${item.qty}`
      );
      if (res.rowCount === 0) {
        throw new Error(`Variant ${item.label} of ${item.name} is out of stock`);
      }
    }
    
    const [payment] = await tx.insert(payments).values({
      userId,
      purpose: 'merch_order',
      purposeId: order.id,
      amountPaise: totalPaise,
    }).returning();
    
    await tx.update(merchOrders).set({ paymentId: payment.id }).where(eq(merchOrders.id, order.id));
    
    // Clear cart
    await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
    await tx.delete(carts).where(eq(carts.id, cart.id));
    
    return { order, payment };
  });
}
