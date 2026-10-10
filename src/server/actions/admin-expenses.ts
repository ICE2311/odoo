"use server";

import { db } from '@/server/db';
import { expenseClaims, ledgerEntries, users } from '@/server/db/schema';
import { requireAdmin } from '@/server/auth/guards';
import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { enqueueEmail } from '@/server/services/email';
import { revalidatePath } from 'next/cache';

export async function approveClaimAction(claimId: string) {
  const admin = await requireAdmin();
  
  const claim = await db.select({
    id: expenseClaims.id,
    claimantId: expenseClaims.claimantId,
    status: expenseClaims.status,
    title: expenseClaims.title,
  }).from(expenseClaims).where(eq(expenseClaims.id, claimId)).then(res => res[0]);
  
  if (!claim) throw new Error("Claim not found");
  if (claim.claimantId === admin.user.id) throw new Error("You cannot approve your own claim");
  if (claim.status !== 'submitted') throw new Error("Claim must be submitted to be approved");

  await db.update(expenseClaims).set({
    status: 'approved',
    reviewedBy: admin.user.id,
    reviewedAt: new Date()
  }).where(eq(expenseClaims.id, claimId));

  const claimant = await db.select({email: users.email}).from(users).where(eq(users.id, claim.claimantId)).then(r => r[0]);

  await enqueueEmail({
    toEmail: claimant.email,
    subject: `Expense Claim Approved: ${claim.title}`,
    html: `<p>Your expense claim for ${claim.title} has been approved and is awaiting payment.</p>`,
    text: `Your expense claim for ${claim.title} has been approved and is awaiting payment.`,
    kind: 'transactional'
  });

  revalidatePath('/admin/expenses');
  return { success: true };
}

export async function rejectClaimAction(claimId: string, reason: string) {
  const admin = await requireAdmin();
  if (!reason.trim()) throw new Error("Rejection reason is required");

  const claim = await db.select().from(expenseClaims).where(eq(expenseClaims.id, claimId)).then(res => res[0]);
  if (!claim) throw new Error("Claim not found");
  // They can reject their own claim? The prompt only says "approving admin cannot approve their own claim".
  if (claim.status !== 'submitted') throw new Error("Claim must be submitted to be rejected");

  await db.update(expenseClaims).set({
    status: 'rejected',
    rejectionReason: reason,
    reviewedBy: admin.user.id,
    reviewedAt: new Date()
  }).where(eq(expenseClaims.id, claimId));

  const claimant = await db.select({email: users.email}).from(users).where(eq(users.id, claim.claimantId)).then(r => r[0]);

  await enqueueEmail({
    toEmail: claimant.email,
    subject: `Expense Claim Rejected: ${claim.title}`,
    html: `<p>Your expense claim for ${claim.title} was rejected.</p><p>Reason: ${reason}</p>`,
    text: `Your expense claim for ${claim.title} was rejected. Reason: ${reason}`,
    kind: 'transactional'
  });

  revalidatePath('/admin/expenses');
  return { success: true };
}

const paySchema = z.object({
  payoutMethod: z.enum(['upi', 'bank', 'cash']),
  payoutRef: z.string().min(1, "Reference is required")
});

export async function markPaidAction(claimId: string, data: z.infer<typeof paySchema>) {
  const admin = await requireAdmin();
  const parsed = paySchema.parse(data);

  return await db.transaction(async (tx) => {
    const claim = await tx.select().from(expenseClaims).where(eq(expenseClaims.id, claimId)).then(res => res[0]);
    if (!claim) throw new Error("Claim not found");
    if (claim.status === 'paid') return { success: true }; // idempotent
    if (claim.status !== 'approved') throw new Error("Claim must be approved to be paid");

    await tx.update(expenseClaims).set({
      status: 'paid',
      paidBy: admin.user.id,
      paidAt: new Date(),
      payoutMethod: parsed.payoutMethod,
      payoutRef: parsed.payoutRef
    }).where(eq(expenseClaims.id, claimId));

    await tx.insert(ledgerEntries).values({
      direction: 'out',
      amountPaise: claim.amountPaise,
      category: 'expense_reimbursement',
      method: parsed.payoutMethod === 'upi' ? 'upi_manual' : parsed.payoutMethod as any,
      sourceType: 'expense_claim',
      sourceId: claim.id,
      eventId: claim.eventId,
      fundraiserId: claim.fundraiserId,
      description: `Reimbursement for ${claim.title}`,
      recordedBy: admin.user.id
    });

    const claimant = await tx.select({email: users.email}).from(users).where(eq(users.id, claim.claimantId)).then(r => r[0]);

    await enqueueEmail({
      toEmail: claimant.email,
      subject: `Expense Claim Paid: ${claim.title}`,
      html: `<p>Your expense claim for ${claim.title} has been paid.</p><p>Method: ${parsed.payoutMethod}<br/>Reference: ${parsed.payoutRef}</p>`,
      text: `Your expense claim for ${claim.title} has been paid. Method: ${parsed.payoutMethod}, Reference: ${parsed.payoutRef}`,
      kind: 'transactional'
    }, tx);

    return { success: true };
  });
}

export async function bulkMarkPaidAction(claimIds: string[], data: z.infer<typeof paySchema>) {
  const admin = await requireAdmin();
  const parsed = paySchema.parse(data);

  return await db.transaction(async (tx) => {
    const claims = await tx.select().from(expenseClaims).where(inArray(expenseClaims.id, claimIds));
    for (const claim of claims) {
      if (claim.status !== 'approved') continue;
      
      await tx.update(expenseClaims).set({
        status: 'paid',
        paidBy: admin.user.id,
        paidAt: new Date(),
        payoutMethod: parsed.payoutMethod,
        payoutRef: parsed.payoutRef
      }).where(eq(expenseClaims.id, claim.id));

      await tx.insert(ledgerEntries).values({
        direction: 'out',
        amountPaise: claim.amountPaise,
        category: 'expense_reimbursement',
        method: parsed.payoutMethod === 'upi' ? 'upi_manual' : parsed.payoutMethod as any,
        sourceType: 'expense_claim',
        sourceId: claim.id,
        eventId: claim.eventId,
        fundraiserId: claim.fundraiserId,
        description: `Reimbursement for ${claim.title}`,
        recordedBy: admin.user.id
      }).onConflictDoNothing(); // prevent double entries

      const claimant = await tx.select({email: users.email}).from(users).where(eq(users.id, claim.claimantId)).then(r => r[0]);
      
      await enqueueEmail({
        toEmail: claimant.email,
        subject: `Expense Claim Paid: ${claim.title}`,
        html: `<p>Your expense claim for ${claim.title} has been paid.</p><p>Method: ${parsed.payoutMethod}<br/>Reference: ${parsed.payoutRef}</p>`,
        text: `Your expense claim for ${claim.title} has been paid. Method: ${parsed.payoutMethod}, Reference: ${parsed.payoutRef}`,
        kind: 'transactional'
      }, tx);
    }
    return { success: true };
  });
}
