import { db } from '@/server/db';
import { payments, refunds } from '@/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import Razorpay from 'razorpay';
import { requireAdmin } from '@/server/auth/guards';
import { registry } from './payments';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function refundPayment(paymentId: string, amountPaise: number, reason: string) {
  const caller = await requireAdmin();

  await db.transaction(async (tx) => {
    // Lock payment row
    const [payment] = await tx.execute(
      sql`SELECT * FROM ${payments} WHERE id = ${paymentId} FOR UPDATE`
    ).then(res => res.rows as any[]);
    
    if (!payment) throw new Error('Payment not found');
    if (payment.status !== 'captured' && payment.status !== 'partially_refunded') {
      throw new Error('Payment cannot be refunded');
    }

    const rzRefund = await razorpay.payments.refund(payment.razorpay_payment_id, {
      amount: amountPaise,
      notes: { reason },
    });

    const [refund] = await tx.insert(refunds).values({
      paymentId,
      amountPaise,
      razorpayRefundId: rzRefund.id,
      reason,
      createdBy: caller.user.id,
      status: rzRefund.status,
    }).returning();

    const newStatus = amountPaise === payment.amount_paise ? 'refunded' : 'partially_refunded';
    await tx.update(payments).set({ status: newStatus }).where(eq(payments.id, paymentId));

    const handler = registry[payment.purpose];
    if (handler) {
      await handler.onRefunded({ tx, payment: { ...payment, status: newStatus }, refund });
    }
  });
}
