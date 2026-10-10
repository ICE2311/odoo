import { db } from '@/server/db';
import { payments, refunds } from '@/server/db/schema';
import { Caller } from '@/server/auth/guards';
import { eq, sql } from 'drizzle-orm';
import Razorpay from 'razorpay';
import crypto from 'crypto';

import {
  registry,
  registerPurpose,
  type PurposeHandler,
  type PaymentContext,
} from './payment-registry';

export { registry, registerPurpose, type PurposeHandler, type PaymentContext };

// Pre-load purpose handlers so the registry is always populated
import './membership';
import './merch-registry';
import './ticket-registry';
import './test_purchase';

function getRazorpay(): Razorpay | null {
  if (process.env.PAYMENT_SIMULATION === 'true') {
    return null;
  }
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret || keyId === 'rzp_test_placeholder') {
    return null;
  }
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export async function createCheckout(
  purpose: 'membership' | 'ticket_order' | 'merch_order' | 'test_purchase',
  purposeId: string,
  caller: Caller
) {
  const handler = registry[purpose];
  if (!handler) throw new Error(`Unknown purpose: ${purpose}`);

  const amount = await handler.computeAmount(purposeId, caller);

  const [payment] = await db.insert(payments).values({
    userId: caller.user!.id,
    purpose,
    purposeId,
    amountPaise: amount,
    status: 'created',
  }).returning();

  const rzp = getRazorpay();

  if (!rzp) {
    // Development / demo mode simulation: allows testing when Razorpay credentials are not yet set
    const simOrderId = `order_sim_${payment.id.replace(/-/g, '').slice(0, 16)}`;
    await db.update(payments).set({ razorpayOrderId: simOrderId }).where(eq(payments.id, payment.id));
    return {
      keyId: 'rzp_test_simulated',
      rzOrderId: simOrderId,
      amount,
      isSimulated: true,
      prefill: {
        name: caller.user?.name || '',
        email: caller.user?.email || '',
      },
    };
  }

  const rzOrder = await rzp.orders.create({
    amount,
    currency: 'INR',
    receipt: payment.id,
  });

  await db.update(payments).set({ razorpayOrderId: rzOrder.id }).where(eq(payments.id, payment.id));

  return {
    keyId: process.env.RAZORPAY_KEY_ID!,
    rzOrderId: rzOrder.id,
    amount,
    isSimulated: false,
    prefill: {
      name: caller.user?.name || '',
      email: caller.user?.email || '',
    },
  };
}

export async function verifyClientPayment(rzOrderId: string, rzPaymentId: string, signature: string) {
  if (rzOrderId.startsWith('order_sim_') || signature === 'simulated' || process.env.PAYMENT_SIMULATION === 'true') {
    // Simulated instant payment in development / test
    await capturePayment(rzPaymentId || 'pay_simulated', rzOrderId);
    return;
  }

  const body = rzOrderId + '|' + rzPaymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(body.toString())
    .digest('hex');

  if (expectedSignature !== signature) {
    throw new Error('Invalid signature');
  }

  await capturePayment(rzPaymentId, rzOrderId);
}

export async function capturePayment(rzPaymentId: string, rzOrderId: string) {
  await db.transaction(async (tx) => {
    // Lock the row
    const res = await tx.execute(
      sql`SELECT * FROM payments WHERE razorpay_order_id = ${rzOrderId} OR id::text = ${rzOrderId} FOR UPDATE`
    );
    const raw = res.rows?.[0] as any;

    if (!raw) throw new Error('Payment not found');
    if (raw.status === 'captured') return;

    await tx
      .update(payments)
      .set({ status: 'captured', razorpayPaymentId: rzPaymentId })
      .where(eq(payments.id, raw.id));

    // Normalize Postgres raw SQL row (snake_case) to standard camelCase properties expected by handlers
    const payment = {
      id: raw.id,
      userId: raw.userId ?? raw.user_id,
      user_id: raw.user_id ?? raw.userId,
      purpose: raw.purpose,
      purposeId: raw.purposeId ?? raw.purpose_id,
      purpose_id: raw.purpose_id ?? raw.purposeId,
      amountPaise: Number(raw.amountPaise ?? raw.amount_paise),
      amount_paise: Number(raw.amount_paise ?? raw.amountPaise),
      currency: raw.currency,
      status: 'captured',
      razorpayOrderId: raw.razorpayOrderId ?? raw.razorpay_order_id,
      razorpayPaymentId: rzPaymentId,
      razorpay_order_id: raw.razorpay_order_id ?? raw.razorpayOrderId,
      razorpay_payment_id: rzPaymentId,
      failureReason: raw.failureReason ?? raw.failure_reason,
      createdAt: raw.createdAt ?? raw.created_at,
      updatedAt: raw.updatedAt ?? raw.updated_at,
    };

    const handler = registry[payment.purpose];
    if (handler) {
      await handler.onCaptured({ tx, payment });
    }
  });
}
