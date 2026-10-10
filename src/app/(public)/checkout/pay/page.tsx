import { db } from '@/server/db';
import { payments, merchOrders } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { PayClientModal } from './pay-client';
import { getHoldMinutes, isPaymentExpired, expireStalePaymentHolds } from '@/server/services/holds';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle, ArrowRight } from 'lucide-react';

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

  const holdMinutes = await getHoldMinutes();
  const isExpired = payment.status === 'failed' || isPaymentExpired(payment, holdMinutes);

  if (isExpired) {
    // Ensure hold release is recorded
    await expireStalePaymentHolds().catch(() => {});

    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-card border border-border rounded-3xl shadow-lg space-y-6 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
          <Clock className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Payment Session Expired</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This payment session timed out after {holdMinutes} minutes. The reserved items or event seats have been released back into available public stock.
          </p>
        </div>
        <div className="pt-2 flex flex-col gap-2.5">
          {payment.purpose === 'ticket_order' ? (
            <Link href="/events" className="w-full">
              <Button className="w-full rounded-xl bg-primary text-primary-foreground font-semibold">
                Browse Events & Re-Order
              </Button>
            </Link>
          ) : (
            <Link href="/shop" className="w-full">
              <Button className="w-full rounded-xl bg-primary text-primary-foreground font-semibold">
                Browse Shop & Re-Order
              </Button>
            </Link>
          )}
          <Link href="/account" className="w-full">
            <Button variant="outline" className="w-full rounded-xl text-muted-foreground">
              My Student Account
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const amountRupees = (payment.amountPaise / 100).toFixed(2);
  const minutesRemaining = Math.max(
    1,
    Math.ceil(
      (new Date(payment.createdAt).getTime() + holdMinutes * 60 * 1000 - Date.now()) / (60 * 1000)
    )
  );

  return (
    <div className="max-w-md mx-auto my-12 p-6 bg-card border border-border rounded-[var(--radius-xl)] shadow-lg space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Complete Payment</h1>
        <p className="text-sm text-muted-foreground">Order Ref: #{payment.purposeId.slice(0, 8)}</p>
      </div>

      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-300 font-medium">
        <span className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-amber-600" /> Hold reservation:
        </span>
        <span className="font-bold">Expires in ~{minutesRemaining} min</span>
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
