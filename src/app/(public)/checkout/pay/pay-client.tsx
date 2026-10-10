'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CreditCard, AlertCircle } from 'lucide-react';

interface PayClientModalProps {
  keyId: string;
  rzOrderId: string;
  amountPaise: number;
  paymentId: string;
}

export function PayClientModal({ keyId, rzOrderId, amountPaise }: PayClientModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handlePay = async () => {
    setLoading(true);
    setError(null);

    const isSimulated = !rzOrderId || rzOrderId.startsWith('order_sim_') || keyId === 'rzp_test_simulated';

    if (isSimulated) {
      try {
        const verifyRes = await fetch('/api/checkout/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rzOrderId,
            rzPaymentId: `pay_sim_${Date.now()}`,
            signature: 'simulated',
          }),
        });

        if (!verifyRes.ok) {
          const vData = await verifyRes.json();
          throw new Error(vData.error || 'Payment verification failed');
        }

        router.push('/account/orders?success=1');
      } catch (err: any) {
        setError(err.message || 'Payment simulation failed');
        setLoading(false);
      }
      return;
    }

    // Live Razorpay
    if (typeof window !== 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        const options = {
          key: keyId,
          amount: amountPaise,
          currency: 'INR',
          name: 'Skyline Student Association',
          order_id: rzOrderId,
          handler: async function (response: any) {
            try {
              const verifyRes = await fetch('/api/checkout/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  rzOrderId: response.razorpay_order_id,
                  rzPaymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                }),
              });

              if (verifyRes.ok) {
                router.push('/account/orders?success=1');
              } else {
                router.push('/checkout/failed');
              }
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
      };
      script.onerror = () => {
        setError('Failed to load payment gateway');
        setLoading(false);
      };
      document.body.appendChild(script);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm bg-destructive/10 text-destructive rounded-[var(--radius-md)] border border-destructive/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-[var(--radius-md)] hover:opacity-90 flex items-center justify-center gap-2 shadow-sm transition-opacity disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Pay Now
          </>
        )}
      </button>
    </div>
  );
}

