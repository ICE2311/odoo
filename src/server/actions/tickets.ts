'use server';

import { createTicketOrder, captureTicketOrder } from '@/server/services/tickets';
import { requireUser } from '@/server/auth/guards';
import { db } from '@/server/db';
import { payments } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import Razorpay from 'razorpay';

function getRazorpay(): Razorpay | null {
  if (process.env.PAYMENT_SIMULATION === 'true') {
    return null;
  }
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret || keyId === 'rzp_test_placeholder') {
    return null;
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export async function createTicketCheckoutAction(eventId: string, qty: number) {
  const caller = await requireUser();

  if (!eventId) throw new Error('Event ID is required');
  if (!qty || qty < 1) throw new Error('Quantity must be at least 1');

  const order = await createTicketOrder(eventId, qty);

  const rzp = getRazorpay();
  let rzOrderId: string;
  let isSimulated = false;

  if (rzp) {
    try {
      const rzOrder = await rzp.orders.create({
        amount: order.amountPaise,
        currency: 'INR',
        receipt: order.paymentId,
      });
      rzOrderId = rzOrder.id;
    } catch (err: any) {
      console.warn('Razorpay order creation fallback to simulated:', err?.message || err);
      rzOrderId = `order_sim_${order.paymentId.replace(/-/g, '').slice(0, 16)}`;
      isSimulated = true;
    }
  } else {
    rzOrderId = `order_sim_${order.paymentId.replace(/-/g, '').slice(0, 16)}`;
    isSimulated = true;
  }

  await db
    .update(payments)
    .set({ razorpayOrderId: rzOrderId })
    .where(eq(payments.id, order.paymentId));

  return {
    success: true,
    orderId: order.orderId,
    paymentId: order.paymentId,
    amountPaise: order.amountPaise,
    rzOrderId,
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_simulated',
    isSimulated,
    prefill: {
      name: caller.user.name || '',
      email: caller.user.email || '',
    },
  };
}

export async function confirmTicketPaymentAction(
  orderId: string,
  rzOrderId?: string,
  rzPaymentId?: string
) {
  await requireUser();
  const tickets = await captureTicketOrder(orderId, rzPaymentId);

  revalidatePath('/account/tickets');
  revalidatePath('/events');
  revalidatePath('/admin/events');

  return {
    success: true,
    orderId,
    ticketsCount: tickets.length,
  };
}

// Retain buyTicketAction for backwards compatibility and tests
export async function buyTicketAction(eventId: string, qty: number) {
  await requireUser();

  if (!eventId) throw new Error('Event ID is required');
  if (!qty || qty < 1) throw new Error('Quantity must be at least 1');

  const order = await createTicketOrder(eventId, qty);
  const tickets = await captureTicketOrder(order.orderId);

  revalidatePath('/account/tickets');
  revalidatePath('/events');
  revalidatePath('/admin/events');

  return {
    success: true,
    orderId: order.orderId,
    ticketsCount: tickets.length,
  };
}
