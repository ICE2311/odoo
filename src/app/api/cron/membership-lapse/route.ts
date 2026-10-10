import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { memberships, users } from '@/server/db/schema';
import { sql } from 'drizzle-orm';
import { enqueueEmail } from '@/server/services/email';
import { onMembershipLapsedHooks } from '@/server/services/membership';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // find memberships that expired between yesterday and now
  const lapsed = await db.execute(sql`
    SELECT m.id, m.user_id, u.email, u.name 
    FROM memberships m
    JOIN users u ON m.user_id = u.id
    WHERE m.status = 'active'
    AND m.ends_at <= ${now.toISOString()}
    AND m.ends_at > ${yesterday.toISOString()}
    -- ensure they don't have a future membership already
    AND NOT EXISTS (
      SELECT 1 FROM memberships m2 
      WHERE m2.user_id = m.user_id AND m2.status = 'active' AND m2.starts_at >= m.ends_at
    )
  `);

  let processed = 0;
  for (const row of lapsed.rows as any[]) {
    await db.transaction(async (tx) => {
      // Execute hooks
      for (const hook of onMembershipLapsedHooks) {
        await hook(row.user_id, tx);
      }

      await enqueueEmail({
        toEmail: row.email,
        subject: 'Your SSA Membership has expired',
        html: `<p>Hi ${row.name}, your membership has expired.</p>`,
        text: `Hi ${row.name}, your membership has expired.`,
        kind: 'transactional',
        refType: 'membership',
        refId: row.id
      }, tx);
    });
    processed++;
  }

  return NextResponse.json({ processed });
}
