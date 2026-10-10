import { db } from '@/server/db';
import { payments, refunds } from '@/server/db/schema';
import { Caller } from '@/server/auth/guards';
import { eq } from 'drizzle-orm';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

type PaymentContext = { tx: any; payment: any };

export type PurposeHandler = {
  computeAmount: (purposeId: string, caller: Caller) => Promise<number>;
  onCaptured: (ctx: PaymentContext) => Promise<void>;
  onFailed: (ctx: PaymentContext) => Promise<void>;
  onRefunded: (ctx: PaymentContext & { refund: any }) => Promise<void>;
};

export const registry: Record<string, PurposeHandler> = {};

export function registerPurpose(purpose: string, handler: PurposeHandler) {
  registry[purpose] = handler;
}

export async function createCheckout(purpose: 'membership' | 'ticket_order' | 'merch_order' | 'test_purchase', purposeId: string, caller: Caller) {
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

  const rzOrder = await razorpay.orders.create({
    amount,
    currency: 'INR',
    receipt: payment.id,
  });

  await db.update(payments).set({ razorpayOrderId: rzOrder.id }).where(eq(payments.id, payment.id));

  return {
    keyId: process.env.RAZORPAY_KEY_ID!,
    rzOrderId: rzOrder.id,
    amount,
    prefill: {
      name: caller.user!.name,
      email: caller.user!.email,
    },
  };
}

export async function verifyClientPayment(rzOrderId: string, rzPaymentId: string, signature: string) {
  const body = rzOrderId + "|" + rzPaymentId;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== signature) {
    throw new Error('Invalid signature');
  }

  await capturePayment(rzPaymentId, rzOrderId);
}

export async function capturePayment(rzPaymentId: string, rzOrderId: string) {
  await db.transaction(async (tx) => {
    // Lock the row
    const [payment] = await tx.execute(
      db.select().from(payments).where(eq(payments.razorpayOrderId, rzOrderId)).toSQL().sql + ' FOR UPDATE'
    ).then((res) => res.rows as any[]);

    if (!payment) throw new Error('Payment not found');
    if (payment.status === 'captured') return;

    await tx.update(payments).set({ status: 'captured', razorpayPaymentId: rzPaymentId }).where(eq(payments.id, payment.id));

    const handler = registry[payment.purpose];
    if (handler) {
      await handler.onCaptured({ tx, payment: { ...payment, status: 'captured', razorpayPaymentId: rzPaymentId } });
    }
  });
}
