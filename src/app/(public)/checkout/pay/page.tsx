import { db } from '@/server/db';
import { payments, merchOrders } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { PayClientModal } from './pay-client';

interface PayPageProps {
  searchParams: Promise<{ paymentId?: string; orderId?: string }>;
}

export default async function CheckoutPayPage(props: PayPageProps) {
  const searchParams = await props.searchParams;
  const paymentId = searchParams.paymentId;
  const orderId = searchParams.orderId;

  if (!paymentId && !orderId) {
    notFound();
  }

  let payment;
  if (paymentId) {
    payment = await db.query.payments.findFirst({
      where: eq(payments.id, paymentId),
    });
  } else if (orderId) {
    const order = await db.query.merchOrders.findFirst({
      where: eq(merchOrders.id, orderId),
    });
    if (order?.paymentId) {
      payment = await db.query.payments.findFirst({
        where: eq(payments.id, order.paymentId),
      });
    }
  }

  if (!payment) {
    notFound();
  }

  if (payment.status === 'captured') {
    redirect(`/checkout/success?payment=${payment.razorpayOrderId || payment.id}`);
  }

  const amountRupees = (payment.amountPaise / 100).toFixed(2);

  return (
    <div className="max-w-md mx-auto my-12 p-6 bg-card border border-border rounded-[var(--radius-xl)] shadow-lg space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Complete Payment</h1>
        <p className="text-sm text-muted-foreground">Order Ref: #{payment.purposeId.slice(0, 8)}</p>
      </div>

      <div className="p-4 bg-muted rounded-[var(--radius-md)] flex justify-between items-center">
        <span className="font-medium text-muted-foreground">Total Amount</span>
        <span className="text-2xl font-bold text-primary">₹{amountRupees}</span>
      </div>

      <PayClientModal
        keyId={process.env.RAZORPAY_KEY_ID || 'rzp_test_simulated'}
        rzOrderId={payment.razorpayOrderId || ''}
        amountPaise={payment.amountPaise}
        paymentId={payment.id}
      />
    </div>
  );
}

