

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { db } from '@/server/db';
import { emailOutbox } from '@/server/db/schema';
import { eq, and, lte, asc } from 'drizzle-orm';

// ─── Transporter ─────────────────────────────────────────────────────────────

let _transporter: Transporter | null = null;

export function getTransporter(): Transporter | null {
  if (_transporter) return _transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '';

  if (!host || !user || !pass) {
    return null;
  }

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 10,
    tls: {
      rejectUnauthorized: false,
    },
  });

  return _transporter;
}

export const transporter = {
  get instance() {
    return getTransporter();
  },
};

// ─── Enqueue Email ────────────────────────────────────────────────────────────

export interface EnqueueEmailOpts {
  toEmail: string;
  subject: string;
  html: string;
  text: string;
  kind: 'transactional' | 'announcement';
  refType?: string;
  refId?: string;
  sendAfter?: Date;
}

type DbLike = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Insert an email into the outbox. Pass `txDb` to run inside an existing
 * transaction. If outside a transaction, triggers an immediate dispatch.
 */
export async function enqueueEmail(
  opts: EnqueueEmailOpts,
  txDb?: DbLike,
): Promise<void> {
  const target = txDb ?? db;
  await target.insert(emailOutbox).values({
    toEmail: opts.toEmail,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    kind: opts.kind,
    refType: opts.refType ?? null,
    refId: opts.refId ?? null,
    sendAfter: opts.sendAfter ?? new Date(),
  });

  // If outside a transaction, immediately flush queued emails
  if (!txDb) {
    flushEmailOutbox().catch((err) =>
      console.warn('[EMAIL OUTBOX] Immediate flush warning:', err?.message || err)
    );
  }
}

// ─── Send one email ──────────────────────────────────────────────────────────

export interface SendEmailOpts {
  toEmail: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(opts: SendEmailOpts): Promise<void> {
  const t = getTransporter();
  const from =
    process.env.EMAIL_FROM ||
    (process.env.SMTP_USER ? `Skyline SSA <${process.env.SMTP_USER}>` : 'noreply@skyline.test');

  if (!t) {
    // Development / unconfigured SMTP fallback: log to console
    console.log('[EMAIL - simulated / no SMTP configured]:', {
      from,
      to: opts.toEmail,
      subject: opts.subject,
      preview: opts.text?.slice(0, 100),
    });
    return;
  }

  const info = await t.sendMail({
    from,
    to: opts.toEmail,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });

  console.log(`[EMAIL DISPATCHED] to=${opts.toEmail} subject="${opts.subject}" id=${info.messageId}`);
}

// ─── Flush Outbox ────────────────────────────────────────────────────────────

export async function flushEmailOutbox(): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  try {
    const queuedEmails = await db.query.emailOutbox.findMany({
      where: and(
        eq(emailOutbox.status, 'queued'),
        lte(emailOutbox.sendAfter, new Date())
      ),
      limit: 50,
      orderBy: [asc(emailOutbox.createdAt)],
    });

    if (queuedEmails.length === 0) {
      return { sent: 0, failed: 0 };
    }

    console.log(`[EMAIL OUTBOX] Processing batch of ${queuedEmails.length} queued email(s)...`);

    for (const item of queuedEmails) {
      try {
        await sendEmail({
          toEmail: item.toEmail,
          subject: item.subject,
          html: item.html,
          text: item.text,
        });

        await db
          .update(emailOutbox)
          .set({
            status: 'sent',
            sentAt: new Date(),
            attempts: item.attempts + 1,
            lastError: null,
          })
          .where(eq(emailOutbox.id, item.id));

        sent++;
      } catch (err: any) {
        const attempts = item.attempts + 1;
        const willFail = attempts >= 3;

        console.error(`[EMAIL ERROR] Failed sending to ${item.toEmail}:`, err?.message || err);

        await db
          .update(emailOutbox)
          .set({
            status: willFail ? 'failed' : 'queued',
            attempts,
            lastError: err?.message || String(err),
          })
          .where(eq(emailOutbox.id, item.id));

        failed++;
      }
    }
  } catch (err) {
    console.error('[EMAIL FLUSH ERROR]', err);
  }

  return { sent, failed };
}

// ─── Automatic Background Worker ─────────────────────────────────────────────
// On platforms without cron triggers (like Railway standalone), this ensures
// announcement and transactional emails are actively dispatched every 15 seconds.
if (typeof setInterval !== 'undefined') {
  const g = globalThis as any;
  if (!g.__emailWorkerActive) {
    g.__emailWorkerActive = true;
    setInterval(() => {
      flushEmailOutbox().catch(() => {});
    }, 15000);
  }
}


