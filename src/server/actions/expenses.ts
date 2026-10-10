'use server';

import { checkRateLimit } from '@/server/utils/rate-limit';
import { db } from '@/server/db';
import { expenseClaims, fundraisers, fundraiserTakings, ledgerEntries } from '@/server/db/schema';
import { requireMember, requireUser } from '@/server/auth/guards';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { publicUrl, normaliseShareLink } from '@/lib/url';
import { revalidatePath } from 'next/cache';
import { enqueueEmail } from '@/server/services/email';
import { recordEntry } from '@/server/services/ledger';
import { v4 as uuidv4 } from 'uuid';

const claimSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  amountPaise: z.number().positive("Amount must be positive"),
  spentOn: z.string().or(z.date()),
  eventId: z.string().uuid().optional().nullable(),
  fundraiserId: z.string().uuid().optional().nullable(),
  receiptUrls: z.array(publicUrl).min(1, "At least one receipt is required").max(5, "Max 5 receipts allowed"),
  payeeUpiId: z.string().min(1, "UPI ID is required").optional().nullable(),
});

export async function submitClaimAction(data: z.infer<typeof claimSchema>) {
  const caller = await requireMember();
  const parsed = claimSchema.parse(data);
  if (!checkRateLimit(`submit-claim-${caller.user.id}`, 5, 60)) throw new Error("Rate limit exceeded");

  const urls = parsed.receiptUrls.map(normaliseShareLink);

  await db.insert(expenseClaims).values({
    claimantId: caller.user.id,
    title: parsed.title,
    description: parsed.description,
    amountPaise: parsed.amountPaise,
    spentOn: new Date(parsed.spentOn).toISOString().split('T')[0],
    eventId: parsed.eventId || null,
    fundraiserId: parsed.fundraiserId || null,
    receiptUrls: urls,
    payeeUpiId: parsed.payeeUpiId || null,
    status: 'submitted'
  });

  await enqueueEmail({
    toEmail: caller.user.email,
    subject: `Expense Claim Submitted: ${parsed.title}`,
    html: `<p>Your expense claim for ${parsed.title} has been submitted and is pending review.</p>`,
    text: `Your expense claim for ${parsed.title} has been submitted and is pending review.`,
    kind: 'transactional'
  });

  revalidatePath('/account/expenses');
  revalidatePath('/expenses');
  return { success: true };
}

export async function withdrawClaimAction(claimId: string) {
  const caller = await requireUser();
  const claims = await db.select().from(expenseClaims).where(and(eq(expenseClaims.id, claimId), eq(expenseClaims.claimantId, caller.user.id)));
  if (!claims.length) throw new Error("Claim not found");
  if (claims[0].status !== 'submitted') throw new Error("Only submitted claims can be withdrawn");

  await db.update(expenseClaims).set({ status: 'withdrawn' }).where(eq(expenseClaims.id, claimId));
  revalidatePath('/account/expenses');
  revalidatePath('/expenses');
  return { success: true };
}

export async function editClaimAction(claimId: string, data: z.infer<typeof claimSchema>) {
  const caller = await requireUser();
  const parsed = claimSchema.parse(data);
  const claims = await db.select().from(expenseClaims).where(and(eq(expenseClaims.id, claimId), eq(expenseClaims.claimantId, caller.user.id)));
  if (!claims.length) throw new Error("Claim not found");
  if (claims[0].status !== 'submitted') throw new Error("Only submitted claims can be edited");

  const urls = parsed.receiptUrls.map(normaliseShareLink);

  await db.update(expenseClaims).set({
    title: parsed.title,
    description: parsed.description,
    amountPaise: parsed.amountPaise,
    spentOn: new Date(parsed.spentOn).toISOString().split('T')[0],
    eventId: parsed.eventId || null,
    fundraiserId: parsed.fundraiserId || null,
    receiptUrls: urls,
    payeeUpiId: parsed.payeeUpiId || null,
  }).where(eq(expenseClaims.id, claimId));

  revalidatePath('/account/expenses');
  revalidatePath('/expenses');
  return { success: true };
}

const fundsCollectedSchema = z.object({
  amountPaise: z.number().positive("Amount must be positive"),
  method: z.enum(['cash', 'upi_manual', 'bank']),
  category: z.enum(['fundraiser_income', 'ticket_sales', 'merch_sales', 'manual_income']).default('manual_income'),
  description: z.string().min(1, "Description is required"),
  fundraiserId: z.string().uuid().optional().nullable(),
  eventId: z.string().uuid().optional().nullable(),
  receiptUrls: z.array(publicUrl).max(5).optional().nullable(),
});

export async function submitFundsCollectedAction(data: z.infer<typeof fundsCollectedSchema>) {
  const caller = await requireMember();
  const parsed = fundsCollectedSchema.parse(data);

  if (!checkRateLimit(`submit-funds-${caller.user.id}`, 10, 60)) {
    throw new Error("Rate limit exceeded");
  }

  const takingId = uuidv4();

  await db.transaction(async (tx) => {
    // If associated with a fundraiser, record into fundraiserTakings
    if (parsed.fundraiserId) {
      await tx.insert(fundraiserTakings).values({
        fundraiserId: parsed.fundraiserId,
        amountPaise: parsed.amountPaise,
        method: parsed.method === 'bank' ? 'upi_manual' : parsed.method,
        note: parsed.description,
        recordedBy: caller.user.id,
      });
    }

    // Record into official double-entry ledger
    await recordEntry(tx, {
      direction: 'in',
      amountPaise: parsed.amountPaise,
      category: parsed.category,
      method: parsed.method,
      sourceType: 'volunteer_collection',
      sourceId: takingId,
      eventId: parsed.eventId || undefined,
      fundraiserId: parsed.fundraiserId || undefined,
      description: `${parsed.description} (Collected by ${caller.user.name || caller.user.email})`,
      recordedBy: caller.user.id,
    });
  });

  const formattedAmount = (parsed.amountPaise / 100).toFixed(2);

  await enqueueEmail({
    toEmail: caller.user.email,
    subject: `Funds Deposited to Ledger: ₹${formattedAmount}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <h2 style="color: #0f172a;">Funds Received & Recorded to Ledger</h2>
        <p>Your submission of <strong>₹${formattedAmount}</strong> collected via ${parsed.method.toUpperCase()} has been recorded in the Skyline Student Association Treasury Ledger.</p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Description:</strong> ${parsed.description}</p>
          <p style="margin: 0 0 8px 0;"><strong>Category:</strong> ${parsed.category.replace(/_/g, ' ').toUpperCase()}</p>
          <p style="margin: 0;"><strong>Collector:</strong> ${caller.user.name || caller.user.email}</p>
        </div>
        <p style="font-size: 13px; color: #64748b;">Thank you for your active contribution to the student community.</p>
      </div>
    `,
    text: `Funds Received: ₹${formattedAmount}\nDescription: ${parsed.description}\nRecorded in Skyline SSA Ledger by ${caller.user.name || caller.user.email}`,
    kind: 'transactional',
  });

  revalidatePath('/account/expenses');
  revalidatePath('/expenses');
  revalidatePath('/admin/finance');
  revalidatePath('/admin/fundraisers');
  revalidatePath('/volunteer');

  return { success: true };
}
