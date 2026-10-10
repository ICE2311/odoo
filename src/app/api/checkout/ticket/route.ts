import { createTicketOrder, captureTicketOrder } from '@/server/services/tickets';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const formData = await req.formData();
  const eventId = formData.get('eventId')?.toString();
  const qty = parseInt(formData.get('qty')?.toString() || '1', 10);

  if (!eventId) return new Response('Missing eventId', { status: 400 });

  try {
    const order = await createTicketOrder(eventId, qty);
    // Simulate Razorpay capture immediately in test/dev
    await captureTicketOrder(order.orderId);

    return NextResponse.redirect(new URL('/account/tickets', req.url), 303);
  } catch (error: any) {
    return new Response(error.message || 'Failed to process ticket order', { status: 400 });
  }
}
