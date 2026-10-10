import { registerPurpose } from './payment-registry';
import { db } from '../db';
import { merchOrders, merchOrderItems, stockMovements, productVariants, users } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { enqueueEmail } from './email';
import { recordEntry } from './ledger';

registerPurpose('merch_order', {
  computeAmount: async (purposeId, caller) => {
    const [order] = await db.select().from(merchOrders).where(eq(merchOrders.id, purposeId));
    if (!order) throw new Error("Order not found");
    return order.totalPaise;
  },
  onCaptured: async ({ tx, payment }) => {
    const orderId = payment.purposeId || payment.purpose_id;
    const amountPaise = payment.amountPaise || payment.amount_paise;

    if (!orderId) {
      console.error('merch_order onCaptured missing orderId', payment);
      return;
    }

    const [order] = await tx.select().from(merchOrders).where(eq(merchOrders.id, orderId));
    if (!order) {
      console.error(`Merch order not found: ${orderId}`);
      return;
    }

    if (order.status === 'paid') return; // Idempotent

    await tx.update(merchOrders).set({ status: 'paid' }).where(eq(merchOrders.id, order.id));

    const items = await tx.select().from(merchOrderItems).where(eq(merchOrderItems.orderId, order.id));

    for (const item of items) {
      await tx.execute(
        sql`UPDATE product_variants SET stock_held = GREATEST(0, stock_held - ${item.qty}), stock_on_hand = GREATEST(0, stock_on_hand - ${item.qty}) WHERE id = ${item.variantId}`
      );

      await tx.insert(stockMovements).values({
        variantId: item.variantId,
        delta: -item.qty,
        reason: 'sale',
        refId: order.id,
      });
    }

    await recordEntry(tx, {
      direction: 'in',
      amountPaise: amountPaise || order.totalPaise,
      category: 'merch_sales',
      method: 'razorpay',
      sourceType: 'merch_order',
      sourceId: order.id,
      description: `Merch Order #${order.orderNumber}`,
    });

    try {
      const [buyer] = await tx.select().from(users).where(eq(users.id, order.userId));
      if (buyer?.email) {
        await enqueueEmail({
          toEmail: buyer.email,
          subject: `Order Confirmation #${order.orderNumber} - Skyline SSA Merch`,
          html: `<p>Thank you for your order! Your merch order <strong>#${order.orderNumber}</strong> has been received and confirmed.</p>`,
          text: `Thank you for your order! Your merch order #${order.orderNumber} has been received and confirmed.`,
          kind: 'transactional',
          refType: 'merch_order',
          refId: order.id,
        }, tx);
      }
    } catch (e) {
      console.warn('Failed to enqueue merch email:', e);
    }
  },
  onFailed: async ({ tx, payment }) => {
    const orderId = payment.purposeId || payment.purpose_id;
    if (!orderId) return;
    const [order] = await tx.select().from(merchOrders).where(eq(merchOrders.id, orderId));
    if (!order) return;
    await tx.update(merchOrders).set({ status: 'cancelled' }).where(eq(merchOrders.id, order.id));

    const items = await tx.select().from(merchOrderItems).where(eq(merchOrderItems.orderId, order.id));
    for (const item of items) {
      await tx.execute(
        sql`UPDATE product_variants SET stock_held = GREATEST(0, stock_held - ${item.qty}) WHERE id = ${item.variantId}`
      );
    }
  },
  onRefunded: async ({ tx, payment, refund }) => {
    const orderId = payment.purposeId || payment.purpose_id;
    if (!orderId) return;
    const [order] = await tx.select().from(merchOrders).where(eq(merchOrders.id, orderId));
    if (!order) return;
    await tx.update(merchOrders).set({ status: 'refunded' }).where(eq(merchOrders.id, order.id));

    const items = await tx.select().from(merchOrderItems).where(eq(merchOrderItems.orderId, order.id));
    for (const item of items) {
      await tx.execute(
        sql`UPDATE product_variants SET stock_on_hand = stock_on_hand + ${item.qty} WHERE id = ${item.variantId}`
      );

      await tx.insert(stockMovements).values({
        variantId: item.variantId,
        delta: item.qty,
        reason: 'refund',
        refId: order.id,
      });
    }

    await recordEntry(tx, {
      direction: 'out',
      amountPaise: refund.amountPaise || refund.amount_paise,
      category: 'refund',
      method: 'razorpay',
      sourceType: 'merch_order',
      sourceId: order.id,
      description: `Refund for Merch Order #${order.orderNumber}`,
    });
  }
});

