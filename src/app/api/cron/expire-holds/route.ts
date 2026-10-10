import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { payments } from '@/server/db/schema';
import { lte, eq, and } from 'drizzle-orm';
import { registry } from '@/server/services/payments';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // hardcode 15 mins for now, could load from settings table as per spec
  const expireBefore = new Date(Date.now() - 15 * 60 * 1000);

  const expiredPayments = await db.select().from(payments).where(
    and(
      eq(payments.status, 'created'),
      lte(payments.createdAt, expireBefore)
    )
  );

  let processed = 0;
  for (const payment of expiredPayments) {
    await db.transaction(async (tx) => {
      await tx.update(payments).set({ status: 'failed', failureReason: 'expired' }).where(eq(payments.id, payment.id));
      const handler = registry[payment.purpose];
      if (handler) {
        await handler.onFailed({ tx, payment: { ...payment, status: 'failed' } });
      }
    });
    processed++;
  }

  return NextResponse.json({ processed });
}
