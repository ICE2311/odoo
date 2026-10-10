import { checkRateLimit } from '@/server/utils/rate-limit';
import { NextResponse } from 'next/server';
import { createCheckout } from '@/server/services/payments';
import { requireUser } from '@/server/auth/guards';
import '@/server/services/membership';
import '@/server/services/merch-registry';
import '@/server/services/test_purchase';

export async function POST(req: Request) {
  try {
    const caller = await requireUser();
    if (!checkRateLimit(`checkout-${caller.user.id}`, 20, 60)) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please wait a moment.' }, { status: 429 });
    }
    const { purpose, purposeId } = await req.json();
    if (!purpose || !purposeId) {
      return NextResponse.json({ error: 'Missing purpose or purposeId' }, { status: 400 });
    }
    const data = await createCheckout(purpose, purposeId, caller);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Checkout creation failed' }, { status: 400 });
  }
}
