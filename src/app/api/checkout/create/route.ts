import { NextResponse } from 'next/server';
import { createCheckout } from '@/server/services/payments';
import { requireUser } from '@/server/auth/guards';
import '@/server/services/test_purchase';

export async function POST(req: Request) {
  try {
    const caller = await requireUser();
    const { purpose, purposeId } = await req.json();
    const data = await createCheckout(purpose, purposeId, caller);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
