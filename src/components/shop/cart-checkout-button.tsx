'use client';

import { useState } from 'react';
import { ArrowRight, Loader2, AlertCircle, Zap, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CartCheckoutButtonProps {
  hasItems: boolean;
  hasOutOfStock: boolean;
}

export function CartCheckoutButton({ hasItems, hasOutOfStock }: CartCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const router = useRouter();

  const ensureRazorpayLoaded = (): Promise<boolean> => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      return Promise.resolve(true);
    }
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!hasItems || hasOutOfStock || loading || demoLoading) return;

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const res = await fetch('/api/checkout/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize checkout');
      }

      // If simulated mode (e.g. dev or unconfigured test keys)
      if (data.isSimulated) {
        const verifyRes = await fetch('/api/checkout/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rzOrderId: data.rzOrderId,
            rzPaymentId: `pay_sim_${Date.now()}`,
            signature: 'simulated',
          }),
        });

        if (!verifyRes.ok) {
          const vData = await verifyRes.json();
          throw new Error(vData.error || 'Payment verification failed');
        }

        router.push('/account/orders?success=1');
        router.refresh();
        return;
      }

      // Real Razorpay Checkout flow
      const scriptLoaded = await ensureRazorpayLoaded();
      if (!scriptLoaded || !(window as any).Razorpay) {
        throw new Error('Unable to load payment gateway. Please check your connection.');
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: 'INR',
        name: 'Skyline Student Association',
        description: `Merch Order #${data.orderNumber || ''}`,
        order_id: data.rzOrderId,
        prefill: data.prefill,
        handler: async function (response: any) {
          try {
            setLoading(true);
            const verifyRes = await fetch('/api/checkout/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                rzOrderId: response.razorpay_order_id,
                rzPaymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              }),
            });

            if (!verifyRes.ok) {
              const vData = await verifyRes.json();
              throw new Error(vData.error || 'Payment verification failed');
            }

            router.push('/account/orders?success=1');
            router.refresh();
          } catch (err: any) {
            setError(err.message || 'Payment verification failed');
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setInfo(
              "Razorpay was closed or showed 'Contact site owner'. If your Razorpay merchant account KYC is pending, you can complete your order instantly using the 'Instant Demo Checkout' button below."
            );
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        setError(resp.error?.description || 'Payment failed on gateway');
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      setError(err.message || 'Checkout failed. Please try again.');
      setLoading(false);
    }
  };

  // Instant Demo Checkout (Bypasses unactivated Razorpay accounts)
  const handleInstantDemoCheckout = async () => {
    if (!hasItems || hasOutOfStock || loading || demoLoading) return;
    setDemoLoading(true);
    setError(null);
    setInfo(null);

    try {
      const res = await fetch('/api/checkout/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize checkout');

      const verifyRes = await fetch('/api/checkout/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rzOrderId: data.rzOrderId,
          rzPaymentId: `pay_demo_${Date.now()}`,
          signature: 'simulated',
        }),
      });

      if (!verifyRes.ok) {
        const vData = await verifyRes.json();
        throw new Error(vData.error || 'Payment verification failed');
      }

      router.push('/account/orders?success=1');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Demo checkout failed');
      setDemoLoading(false);
    }
  };

  const isDisabled = !hasItems || hasOutOfStock || loading || demoLoading;

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-start gap-2 p-3 text-xs bg-destructive/10 text-destructive rounded-[var(--radius-md)] border border-destructive/20">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {info && (
        <div className="p-3 text-xs bg-amber-50 text-amber-900 rounded-[var(--radius-md)] border border-amber-200">
          {info}
        </div>
      )}

      <form
        action="/api/checkout/cart"
        method="POST"
        onSubmit={(e) => {
          handleCheckout(e as any);
        }}
      >
        <button
          type="submit"
          disabled={isDisabled}
          className="w-full py-3.5 text-base font-bold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] flex items-center justify-center gap-2 shadow-sm transition-opacity"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Opening Gateway...
            </>
          ) : hasOutOfStock ? (
            'Some Items Out of Stock'
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              Pay with Razorpay
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {!hasOutOfStock && hasItems && (
        <button
          type="button"
          disabled={isDisabled}
          onClick={handleInstantDemoCheckout}
          title="Use this to bypass Razorpay unactivated merchant or KYC errors"
          className="w-full py-2.5 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-[var(--radius-md)] border border-border text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          {demoLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Completing Order...
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Instant Demo Checkout (Simulated)
            </>
          )}
        </button>
      )}
    </div>
  );
}
