import { NextRequest, NextResponse } from 'next/server';
import { sql, eq } from 'drizzle-orm';
import { pool } from '@/server/db';
import { db } from '@/server/db';
import { emailOutbox } from '@/server/db/schema';
import { sendEmail } from '@/server/services/email';

const MAX_ATTEMPTS = 3;

export async function GET(req: NextRequest) {
  // Validate bearer token
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const batchSize = Number(process.env.EMAIL_BATCH_SIZE ?? 50);
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  try {
    // Use a pooled client for SELECT ... FOR UPDATE SKIP LOCKED
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query<{
        id: string;
        to_email: string;
        subject: string;
        html: string;
        text: string;
        attempts: number;
      }>(
        `SELECT id, to_email, subject, html, text, attempts
           FROM email_outbox
          WHERE status = 'queued'
            AND send_after <= NOW()
          ORDER BY send_after ASC
          LIMIT $1
          FOR UPDATE SKIP LOCKED`,
        [batchSize],
      );

      await client.query('COMMIT');

      for (const row of rows) {
        try {
          await sendEmail({
            toEmail: row.to_email,
            subject: row.subject,
            html: row.html,
            text: row.text,
          });

          await db
            .update(emailOutbox)
            .set({
              status: 'sent',
              sentAt: new Date(),
              attempts: row.attempts + 1,
            })
            .where(eq(emailOutbox.id, row.id));

          sent++;
        } catch (err) {
          const newAttempts = row.attempts + 1;
          const nowFailed = newAttempts >= MAX_ATTEMPTS;

          await db
            .update(emailOutbox)
            .set({
              attempts: newAttempts,
              status: nowFailed ? 'failed' : 'queued',
              lastError: err instanceof Error ? err.message : String(err),
            })
            .where(eq(emailOutbox.id, row.id));

          if (nowFailed) failed++;
          else skipped++;
        }
      }
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[cron/send-emails] error:', err);
    return NextResponse.json(
      { error: 'Internal error', detail: String(err) },
      { status: 500 },
    );
  }

  return NextResponse.json({ sent, failed, skipped });
}

