'use client';

import { useState } from 'react';
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CartCheckoutButtonProps {
  hasItems: boolean;
  hasOutOfStock: boolean;
}

export function CartCheckoutButton({ hasItems, hasOutOfStock }: CartCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const handleCheckout = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!hasItems || hasOutOfStock || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/checkout/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
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
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setError(err.message || 'Checkout failed. Please try again.');
      setLoading(false);
    }
  };

  const isDisabled = !hasItems || hasOutOfStock || loading;

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm bg-destructive/10 text-destructive rounded-[var(--radius-md)] border border-destructive/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form action="/api/checkout/cart" method="POST" onSubmit={(e) => {
        // Intercept form submit to use rich Razorpay modal
        handleCheckout(e as any);
      }}>
        <button
          type="submit"
          disabled={isDisabled}
          className="w-full py-4 text-base font-bold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] flex items-center justify-center gap-2 shadow-sm transition-opacity"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing Order...
            </>
          ) : hasOutOfStock ? (
            'Some Items Out of Stock'
          ) : (
            <>
              Checkout securely
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

