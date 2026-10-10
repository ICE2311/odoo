import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/server/db';
import { webhookEvents, payments } from '@/server/db/schema';
import { capturePayment, registry } from '@/server/services/payments';
import { eq } from 'drizzle-orm';
import '@/server/services/test_purchase'; // ensure registry is loaded

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('x-razorpay-signature');
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');

  if (expectedSignature !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = JSON.parse(body);
  const eventId = event.payload?.payment?.entity?.id || event.event;

  try {
    const [existing] = await db.insert(webhookEvents).values({
      provider: 'razorpay',
      eventId: eventId + '_' + event.event,
      type: event.event,
      payloadJson: event,
    }).onConflictDoNothing().returning();

    if (!existing) {
      return NextResponse.json({ status: 'ok', message: 'already processed' });
    }

    if (event.event === 'payment.captured') {
      const rzPaymentId = event.payload.payment.entity.id;
      const rzOrderId = event.payload.payment.entity.order_id;
      if (rzOrderId) {
        await capturePayment(rzPaymentId, rzOrderId);
      }
    } else if (event.event === 'payment.failed') {
      const rzOrderId = event.payload.payment.entity.order_id;
      if (rzOrderId) {
        const [payment] = await db.select().from(payments).where(eq(payments.razorpayOrderId, rzOrderId));
        if (payment && payment.status === 'created') {
          await db.update(payments).set({ status: 'failed', failureReason: 'Webhook reported failure' }).where(eq(payments.id, payment.id));
          const handler = registry[payment.purpose];
          if (handler) await handler.onFailed({ tx: db, payment });
        }
      }
    }

    await db.update(webhookEvents).set({ processedAt: new Date() }).where(eq(webhookEvents.id, existing.id));
    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
