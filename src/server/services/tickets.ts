import { db } from '@/server/db';
import { events, ticketOrders, tickets, payments, ledgerEntries } from '@/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getCaller } from '@/server/auth/guards';
import { z } from 'zod';
import crypto from 'crypto';

export async function createTicketOrder(eventId: string, qty: number) {
  const caller = await getCaller();
  if (caller.kind === 'visitor') throw new Error('UNAUTHORIZED');

  return await db.transaction(async (tx) => {
    // 1. Get event and verify constraints
    const eventRows = await tx.execute(
      sql`SELECT id, status, sales_open_at, sales_close_at, capacity, seats_sold, seats_held, member_price_paise, non_member_price_paise, max_tickets_per_user 
          FROM events 
          WHERE id = ${eventId} FOR UPDATE`
    );
    if (eventRows.rows.length === 0) throw new Error('Event not found');
    const event = eventRows.rows[0] as any;

    if (event.status !== 'published') throw new Error('Event not available for sale');
    const now = new Date();
    if (now < new Date(event.sales_open_at) || now > new Date(event.sales_close_at)) {
      throw new Error('Ticket sales are closed');
    }

    if (qty > event.max_tickets_per_user) {
      throw new Error(`Cannot buy more than ${event.max_tickets_per_user} tickets`);
    }

    if (event.seats_sold + event.seats_held + qty > event.capacity) {
      throw new Error('Sold out / not enough seats');
    }

    // 2. Compute amount
    let totalPaise = 0;
    if (caller.isMember) {
      // 1 member ticket, remaining non-member
      totalPaise += event.member_price_paise;
      if (qty > 1) {
        totalPaise += event.non_member_price_paise * (qty - 1);
      }
    } else {
      // all non-member
      totalPaise += event.non_member_price_paise * qty;
    }

    // 3. Update seats held
    await tx.execute(
      sql`UPDATE events SET seats_held = seats_held + ${qty} WHERE id = ${eventId}`
    );

    // 4. Create payment and ticket_order
    const [payment] = await tx.insert(payments).values({
      userId: caller.user.id,
      purpose: 'ticket_order',
      purposeId: 'temp', // will update
      amountPaise: totalPaise,
      currency: 'INR',
      status: 'created',
    }).returning();

    const [order] = await tx.insert(ticketOrders).values({
      userId: caller.user.id,
      eventId: eventId,
      qty,
      totalPaise,
      status: 'pending',
      paymentId: payment.id,
    }).returning();

    // Update purposeId
    await tx.update(payments).set({ purposeId: order.id }).where(eq(payments.id, payment.id));

    // Return Razorpay-like minimal info
    return {
      orderId: order.id,
      paymentId: payment.id,
      amountPaise: totalPaise,
    };
  });
}

export async function captureTicketOrder(orderId: string, razorpayPaymentId?: string) {
  const caller = await getCaller();
  if (caller.kind === 'visitor') throw new Error('UNAUTHORIZED');

  const finalPaymentId =
    razorpayPaymentId && razorpayPaymentId !== 'test_pay_id'
      ? razorpayPaymentId
      : `pay_sim_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  return await db.transaction(async (tx) => {
    const orderRows = await tx.execute(
      sql`SELECT id, user_id, event_id, qty, total_paise, status, payment_id FROM ticket_orders WHERE id = ${orderId} FOR UPDATE`
    );
    if (orderRows.rows.length === 0) throw new Error('Order not found');
    const order = orderRows.rows[0] as any;
    
    if (order.status !== 'pending') throw new Error('Order is not pending');

    const eventRows = await tx.execute(
      sql`SELECT member_price_paise, non_member_price_paise FROM events WHERE id = ${order.event_id}`
    );
    const event = eventRows.rows[0] as any;

    // Check membership at this moment
    const isMember = caller.isMember && caller.user.id === order.user_id;

    // 1. Mark payment and order as paid
    await tx.update(payments)
      .set({ status: 'captured', razorpayPaymentId: finalPaymentId, updatedAt: new Date() })
      .where(eq(payments.id, order.payment_id));

    await tx.update(ticketOrders)
      .set({ status: 'paid' })
      .where(eq(ticketOrders.id, orderId));

    // 2. Transfer held seats to sold
    await tx.execute(
      sql`UPDATE events SET seats_held = seats_held - ${order.qty}, seats_sold = seats_sold + ${order.qty} WHERE id = ${order.event_id}`
    );

    // 3. Create tickets
    const newTickets = [];
    for (let i = 0; i < order.qty; i++) {
      let priceType: 'member' | 'non_member' | 'comp' = 'non_member';
      let pricePaise = event.non_member_price_paise;
      if (isMember && i === 0) {
        priceType = 'member';
        pricePaise = event.member_price_paise;
      }

      // generate unique short code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();

      newTickets.push({
        orderId: order.id,
        eventId: order.event_id,
        ownerUserId: order.user_id,
        holderName: caller.user.name || caller.user.email, // default to buyer
        priceType,
        pricePaise,
        code,
        status: 'valid' as const,
      });
    }

    const insertedTickets = await tx.insert(tickets).values(newTickets).returning();

    // 4. Ledger entry (only if amount > 0)
    if (order.total_paise > 0) {
      await tx.insert(ledgerEntries).values({
        direction: 'in',
        amountPaise: order.total_paise,
        category: 'ticket_sales',
        method: 'razorpay',
        sourceType: 'ticket_order',
        sourceId: order.id,
        eventId: order.event_id,
        description: `Ticket order ${order.id}`,
        recordedBy: caller.user.id,
      });
    }

    return insertedTickets;
  });
}

