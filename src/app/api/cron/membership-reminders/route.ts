import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { memberships, membershipReminders, users, settings } from '@/server/db/schema';
import { eq, and, gt, sql } from 'drizzle-orm';
import { enqueueEmail } from '@/server/services/email';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get reminder days
  const setting = await db.query.settings.findFirst({ where: eq(settings.key, 'reminder_days') });
  const reminderDaysSetting = (setting?.valueJson as number | number[]) || [30, 7, 1];
  const thresholds = Array.isArray(reminderDaysSetting) ? reminderDaysSetting : [reminderDaysSetting];

  const now = new Date();
  let sent = 0;

  for (const daysBefore of thresholds) {
    const targetDate = new Date(now.getTime() + daysBefore * 24 * 60 * 60 * 1000);
    // Find active memberships expiring around targetDate (same calendar day)
    const candidates = await db.execute(sql`
      SELECT m.id, m.ends_at, u.email, u.name 
      FROM memberships m
      JOIN users u ON m.user_id = u.id
      WHERE m.status = 'active'
      AND DATE(m.ends_at) = DATE(${targetDate.toISOString()})
      AND NOT EXISTS (
        SELECT 1 FROM membership_reminders mr 
        WHERE mr.membership_id = m.id AND mr.days_before = ${daysBefore}
      )
    `);

    for (const row of candidates.rows as any[]) {
      await db.transaction(async (tx) => {
        await tx.insert(membershipReminders).values({
          membershipId: row.id,
          daysBefore,
        });
        await enqueueEmail({
          toEmail: row.email,
          subject: 'Your SSA Membership is expiring soon',
          html: `<p>Hi ${row.name}, your membership expires in ${daysBefore} days.</p>`,
          text: `Hi ${row.name}, your membership expires in ${daysBefore} days.`,
          kind: 'transactional',
          refType: 'membership',
          refId: row.id
        }, tx);
      });
      sent++;
    }
  }

  return NextResponse.json({ sent });
}
