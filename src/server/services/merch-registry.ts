import { registerPurpose } from './payment-registry';
import { db } from '../db';
import { merchOrders, merchOrderItems, stockMovements, productVariants, ledgerEntries, memberships } from '../db/schema';
import { eq, and, sql, lte, gt } from 'drizzle-orm';
import { enqueueEmail } from './email';

registerPurpose('merch_order', {
  computeAmount: async (purposeId, caller) => {
    const [order] = await db.select().from(merchOrders).where(eq(merchOrders.id, purposeId));
    if (!order) throw new Error("Order not found");
    return order.totalPaise;
  },
  onCaptured: async ({ tx, payment }) => {
    const [order] = await tx.select().from(merchOrders).where(eq(merchOrders.id, payment.purposeId));
    
    const now = new Date();
    const activeMember = await tx.query.memberships.findFirst({
      where: and(
        eq(memberships.userId, payment.userId),
        eq(memberships.status, 'active'),
        lte(memberships.startsAt, now),
        gt(memberships.endsAt, now),
      )
    });
    
    if (!activeMember) {
      await tx.update(merchOrders).set({ status: 'cancelled' }).where(eq(merchOrders.id, order.id));
      
      const items = await tx.select().from(merchOrderItems).where(eq(merchOrderItems.orderId, order.id));
      for (const item of items) {
        await tx.execute(sql`UPDATE product_variants SET stock_held = stock_held - ${item.qty} WHERE id = ${item.variantId}`);
      }
      return;
    }
    
    await tx.update(merchOrders).set({ status: 'paid' }).where(eq(merchOrders.id, order.id));
    
    const items = await tx.select().from(merchOrderItems).where(eq(merchOrderItems.orderId, order.id));
    
    for (const item of items) {
      await tx.execute(sql`UPDATE product_variants SET stock_held = stock_held - ${item.qty}, stock_on_hand = stock_on_hand - ${item.qty} WHERE id = ${item.variantId}`);
      
      await tx.insert(stockMovements).values({
        variantId: item.variantId,
        delta: -item.qty,
        reason: 'sale',
        refId: order.id,
      });
    }
    
    await tx.insert(ledgerEntries).values({
      direction: 'in',
      amountPaise: payment.amountPaise,
      category: 'merch_sales',
      method: 'razorpay',
      sourceType: 'merch_order',
      sourceId: order.id,
    });
  },
  onFailed: async ({ tx, payment }) => {
    const [order] = await tx.select().from(merchOrders).where(eq(merchOrders.id, payment.purposeId));
    await tx.update(merchOrders).set({ status: 'cancelled' }).where(eq(merchOrders.id, order.id));
    
    const items = await tx.select().from(merchOrderItems).where(eq(merchOrderItems.orderId, order.id));
    for (const item of items) {
      await tx.execute(sql`UPDATE product_variants SET stock_held = stock_held - ${item.qty} WHERE id = ${item.variantId}`);
    }
  },
  onRefunded: async ({ tx, payment, refund }) => {
    const [order] = await tx.select().from(merchOrders).where(eq(merchOrders.id, payment.purposeId));
    await tx.update(merchOrders).set({ status: 'refunded' }).where(eq(merchOrders.id, order.id));
    
    const items = await tx.select().from(merchOrderItems).where(eq(merchOrderItems.orderId, order.id));
    for (const item of items) {
      await tx.execute(sql`UPDATE product_variants SET stock_on_hand = stock_on_hand + ${item.qty} WHERE id = ${item.variantId}`);
      
      await tx.insert(stockMovements).values({
        variantId: item.variantId,
        delta: item.qty,
        reason: 'refund',
        refId: order.id,
      });
    }
    
    await tx.insert(ledgerEntries).values({
      direction: 'out',
      amountPaise: refund.amountPaise,
      category: 'refund',
      method: 'razorpay',
      sourceType: 'merch_order',
      sourceId: order.id,
    });
  }
});
