'use server';

import { checkRateLimit } from '@/server/utils/rate-limit';
import { db } from '@/server/db';
import { expenseClaims } from '@/server/db/schema';
import { requireMember, requireUser } from '@/server/auth/guards';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { publicUrl, normaliseShareLink } from '@/lib/url';
import { revalidatePath } from 'next/cache';
import { enqueueEmail } from '@/server/services/email';


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

  revalidatePath('/expenses');
  return { success: true };
}

export async function withdrawClaimAction(claimId: string) {
  const caller = await requireUser();
  const claims = await db.select().from(expenseClaims).where(and(eq(expenseClaims.id, claimId), eq(expenseClaims.claimantId, caller.user.id)));
  if (!claims.length) throw new Error("Claim not found");
  if (claims[0].status !== 'submitted') throw new Error("Only submitted claims can be withdrawn");

  await db.update(expenseClaims).set({ status: 'withdrawn' }).where(eq(expenseClaims.id, claimId));
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

  revalidatePath('/expenses');
  return { success: true };
}
