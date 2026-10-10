'use server';

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { db } from '@/server/db';
import { emailOutbox } from '@/server/db/schema';

// ─── Transporter ─────────────────────────────────────────────────────────────

let _transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (_transporter) return _transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  _transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 10,
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
 * transaction (e.g. alongside the business action that triggered the email).
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
}

// ─── Send one email (used by the cron) ──────────────────────────────────────

export interface SendEmailOpts {
  toEmail: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(opts: SendEmailOpts): Promise<void> {
  const t = getTransporter();
  if (!t) {
    // Development fallback: log to console instead of crashing
    console.log('[EMAIL - no SMTP configured]', {
      to: opts.toEmail,
      subject: opts.subject,
      text: opts.text,
    });
    return;
  }

  await t.sendMail({
    from: process.env.EMAIL_FROM ?? 'noreply@skyline.test',
    to: opts.toEmail,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
}

