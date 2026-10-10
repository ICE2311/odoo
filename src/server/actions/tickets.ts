'use server';

import { createTicketOrder, captureTicketOrder } from '@/server/services/tickets';
import { requireUser } from '@/server/auth/guards';
import { revalidatePath } from 'next/cache';

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

