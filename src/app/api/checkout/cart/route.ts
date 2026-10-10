import { NextRequest, NextResponse } from 'next/server';
import { getCaller } from '@/server/auth/guards';
import { getMyCart } from '@/server/data/me/cart';
import { createMerchCheckout } from '@/server/services/merch';
import { db } from '@/server/db';
import { payments } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import Razorpay from 'razorpay';
import { capturePayment } from '@/server/services/payments';

export async function POST(req: NextRequest) {
  try {
    const isJson =
      req.headers.get('content-type')?.includes('application/json') ||
      req.headers.get('accept')?.includes('application/json');

    const caller = await getCaller();
    if (caller.kind === 'visitor') {
      if (isJson) {
        return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login?next=/cart', req.url), 303);
    }

    if (!caller.isMember && !caller.isAdmin) {
      if (isJson) {
        return NextResponse.json(
          { error: 'Forbidden: Active membership required to purchase merchandise.' },
          { status: 403 }
        );
      }
      return NextResponse.redirect(
        new URL('/account/membership?error=Active+membership+required+to+purchase+merchandise', req.url),
        303
      );
    }

    const cart = await getMyCart();
    if (!cart.items || cart.items.length === 0) {
      if (isJson) {
        return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 });
      }
      return NextResponse.redirect(new URL('/cart?error=Your+cart+is+empty', req.url), 303);
    }

    const outOfStock = cart.items.find((item) => !item.inStock);
    if (outOfStock) {
      if (isJson) {
        return NextResponse.json(
          { error: `Item "${outOfStock.label}" does not have enough stock available.` },
          { status: 400 }
        );
      }
      return NextResponse.redirect(
        new URL(`/cart?error=Item+${encodeURIComponent(outOfStock.label)}+out+of+stock`, req.url),
        303
      );
    }

    // 1. Create merch checkout (holds stock, creates pending order & payment, clears cart)
    const { order, payment } = await createMerchCheckout(caller.user.id);

    // 2. Setup Razorpay order ID or simulated order ID
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    let rzOrderId: string;
    let isSimulated = false;

    if (keyId && keySecret && keyId !== 'rzp_test_placeholder') {
      try {
        const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
        const rzOrder = await rzp.orders.create({
          amount: payment.amountPaise,
          currency: 'INR',
          receipt: payment.id,
        });
        rzOrderId = rzOrder.id;
      } catch (err: any) {
        console.warn('Razorpay order creation fallback to simulated:', err?.message || err);
        rzOrderId = `order_sim_${payment.id.replace(/-/g, '').slice(0, 16)}`;
        isSimulated = true;
      }
    } else {
      rzOrderId = `order_sim_${payment.id.replace(/-/g, '').slice(0, 16)}`;
      isSimulated = true;
    }

    await db
      .update(payments)
      .set({ razorpayOrderId: rzOrderId })
      .where(eq(payments.id, payment.id));

    // 3. Return JSON if API client
    if (isJson) {
      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentId: payment.id,
        rzOrderId,
        keyId: keyId || 'rzp_test_simulated',
        amount: payment.amountPaise,
        isSimulated,
        prefill: {
          name: caller.user.name || '',
          email: caller.user.email || '',
        },
      });
    }

    // 4. If plain HTML form submit
    if (isSimulated) {
      // In simulated / test mode, immediately capture payment and redirect to orders
      await capturePayment(`pay_sim_${Date.now()}`, rzOrderId);
      return NextResponse.redirect(new URL('/account/orders?success=1', req.url), 303);
    }

    // If live Razorpay with HTML form POST, redirect to interactive payment page
    return NextResponse.redirect(new URL(`/checkout/pay?paymentId=${payment.id}&orderId=${order.id}`, req.url), 303);
  } catch (err: any) {
    const isJson =
      req.headers.get('content-type')?.includes('application/json') ||
      req.headers.get('accept')?.includes('application/json');

    if (isJson) {
      return NextResponse.json({ error: err.message || 'Checkout failed' }, { status: 400 });
    }

    return NextResponse.redirect(
      new URL(`/cart?error=${encodeURIComponent(err.message || 'Checkout failed')}`, req.url),
      303
    );
  }
}

