import { registerPurpose } from './payment-registry';
import { db } from '../db';
import { ticketOrders, events, ledgerEntries } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { captureTicketOrder } from './tickets';

registerPurpose('ticket_order', {
  computeAmount: async (purposeId) => {
    const [order] = await db.select().from(ticketOrders).where(eq(ticketOrders.id, purposeId));
    if (!order) throw new Error('Ticket order not found');
    return order.totalPaise;
  },
  onCaptured: async ({ tx, payment }) => {
    await captureTicketOrder(payment.purposeId, payment.razorpayPaymentId || undefined);
  },
  onFailed: async ({ tx, payment }) => {
    const [order] = await tx.select().from(ticketOrders).where(eq(ticketOrders.id, payment.purposeId));
    if (order && order.status === 'pending') {
      await tx.update(ticketOrders).set({ status: 'cancelled' }).where(eq(ticketOrders.id, order.id));
      await tx.execute(
        sql`UPDATE events SET seats_held = seats_held - ${order.qty} WHERE id = ${order.eventId}`
      );
    }
  },
  onRefunded: async ({ tx, payment, refund }) => {
    const [order] = await tx.select().from(ticketOrders).where(eq(ticketOrders.id, payment.purposeId));
    if (order) {
      await tx.update(ticketOrders).set({ status: 'refunded' }).where(eq(ticketOrders.id, order.id));
      await tx.execute(
        sql`UPDATE events SET seats_sold = seats_sold - ${order.qty} WHERE id = ${order.eventId}`
      );
      await tx.insert(ledgerEntries).values({
        direction: 'out',
        amountPaise: refund.amountPaise,
        category: 'refund',
        method: 'razorpay',
        sourceType: 'ticket_order',
        sourceId: order.id,
        eventId: order.eventId,
        description: `Refund for ticket order ${order.id}`,
      });
    }
  },
});

