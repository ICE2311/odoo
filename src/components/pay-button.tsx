'use client'

import { useState } from 'react';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';

export function PayButton({ purpose, purposeId }: { purpose: string, purposeId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePayment = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose, purposeId })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: 'INR',
        name: 'Skyline SSA',
        description: 'Payment',
        order_id: data.rzOrderId,
        prefill: data.prefill,
        handler: async function (response: any) {
          const verifyRes = await fetch('/api/checkout/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              rzOrderId: response.razorpay_order_id,
              rzPaymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature
            })
          });
          if (verifyRes.ok) {
            router.push(`/checkout/success?payment=\${data.rzOrderId}`);
          } else {
            router.push('/checkout/failed');
          }
        }
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.open();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      <Button onClick={handlePayment} disabled={loading}>
        {loading ? 'Processing...' : 'Pay Now'}
      </Button>
    </>
  );
}
