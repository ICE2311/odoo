import { NextResponse } from 'next/server';
import { verifyClientPayment } from '@/server/services/payments';
import '@/server/services/membership';
import '@/server/services/merch-registry';
import '@/server/services/test_purchase';

export async function POST(req: Request) {
  try {
    const { rzOrderId, rzPaymentId, signature } = await req.json();
    if (!rzOrderId) {
      return NextResponse.json({ error: 'Missing rzOrderId' }, { status: 400 });
    }
    await verifyClientPayment(rzOrderId, rzPaymentId, signature);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Payment verification failed' }, { status: 400 });
  }
}
