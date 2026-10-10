import { NextResponse } from 'next/server';
import { expireStalePaymentHolds } from '@/server/services/holds';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = await expireStalePaymentHolds();

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    ...results,
  });
}
