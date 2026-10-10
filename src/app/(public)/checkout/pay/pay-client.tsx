'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CreditCard, AlertCircle, Zap } from 'lucide-react';

interface PayClientModalProps {
  keyId: string;
  rzOrderId: string;
  amountPaise: number;
  paymentId: string;
}

export function PayClientModal({ keyId, rzOrderId, amountPaise }: PayClientModalProps) {
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const router = useRouter();

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);

    const isSimulated = !rzOrderId || rzOrderId.startsWith('order_sim_') || keyId === 'rzp_test_simulated';

    if (isSimulated) {
      await handleDemoPay();
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
                router.refresh();
              } else {
                const vErr = await verifyRes.json().catch(() => ({}));
                setError(vErr.error || 'Payment verification failed');
                setLoading(false);
              }
            } catch (err: any) {
              setError(err.message || 'Payment verification failed');
              setLoading(false);
            }
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
              setInfo(
                "Razorpay was closed or showed 'Contact site owner'. If your Razorpay merchant account is pending KYC, use the 'Instant Demo Payment' button below."
              );
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (resp: any) {
          setError(resp.error?.description || 'Payment gateway failed');
          setLoading(false);
        });
        rzp.open();
      };
      script.onerror = () => {
        setError('Failed to load payment gateway');
        setLoading(false);
      };
      document.body.appendChild(script);
    }
  };

  const handleDemoPay = async () => {
    setDemoLoading(true);
    setError(null);
    setInfo(null);

    try {
      const verifyRes = await fetch('/api/checkout/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rzOrderId,
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
      setError(err.message || 'Payment simulation failed');
      setDemoLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 p-3 text-xs bg-destructive/10 text-destructive rounded-[var(--radius-md)] border border-destructive/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {info && (
        <div className="p-3 text-xs bg-amber-50 text-amber-900 rounded-[var(--radius-md)] border border-amber-200">
          {info}
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={loading || demoLoading}
        className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-[var(--radius-md)] hover:opacity-90 flex items-center justify-center gap-2 shadow-sm transition-opacity disabled:opacity-50 text-sm"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Opening Gateway...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            Pay with Razorpay
          </>
        )}
      </button>

      <button
        type="button"
        onClick={handleDemoPay}
        disabled={loading || demoLoading}
        title="Bypass Razorpay KYC or unactivated merchant error"
        className="w-full py-2.5 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-[var(--radius-md)] border border-border flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-xs"
      >
        {demoLoading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Verifying Payment...
          </>
        ) : (
          <>
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Instant Demo Payment (Simulated)
          </>
        )}
      </button>
    </div>
  );
}
