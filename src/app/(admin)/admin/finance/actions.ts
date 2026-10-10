'use server';

import { requireUser, requireAdmin } from '@/server/auth/guards';
import { db } from '@/server/db';
import { ledgerEntries } from '@/server/db/schema';
import { recordEntry } from '@/server/services/ledger';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import { reconcile } from '@/server/data/admin/finance';

export async function addManualEntry(formData: FormData) {
  const caller = await requireUser();
  if (!caller.isAdmin && !caller.isMember) {
    throw new Error('FORBIDDEN: Admin or Active Member privileges required to record ledger entries');
  }

  const direction = (formData.get('direction') as 'in' | 'out') || 'in';
  const amountStr = formData.get('amount') as string;
  const amount = Math.round(Number(amountStr) * 100);
  const method = (formData.get('method') as 'cash' | 'upi_manual' | 'bank') || 'cash';
  const categoryRaw = formData.get('category') as string;
  const category = (categoryRaw as any) || (direction === 'in' ? 'manual_income' : 'manual_expense');
  const description = (formData.get('description') as string)?.trim();
  const eventId = (formData.get('eventId') as string)?.trim() || undefined;
  const fundraiserId = (formData.get('fundraiserId') as string)?.trim() || undefined;

  if (!description) {
    throw new Error('Description is required for compliance');
  }
  if (!amount || isNaN(amount) || amount <= 0) {
    throw new Error('Amount must be greater than zero');
  }

  await db.transaction(async (tx) => {
    await recordEntry(tx, {
      direction,
      amountPaise: amount,
      category,
      method,
      sourceType: 'manual_entry',
      sourceId: uuidv4(),
      eventId: eventId && eventId.length > 10 ? eventId : undefined,
      fundraiserId: fundraiserId && fundraiserId.length > 10 ? fundraiserId : undefined,
      description,
      recordedBy: caller.user.id,
    });
  });

  revalidatePath('/admin/finance');
  revalidatePath('/admin');
}

export async function reverseEntry(id: string) {
  const caller = await requireAdmin();

  const entry = await db.query.ledgerEntries.findFirst({
    where: eq(ledgerEntries.id, id),
  });

  if (!entry) throw new Error('Entry not found');

  await db.transaction(async (tx) => {
    await recordEntry(tx, {
      direction: entry.direction === 'in' ? 'out' : 'in',
      amountPaise: entry.amountPaise,
      category: entry.category,
      method: entry.method,
      sourceType: entry.sourceType,
      sourceId: uuidv4(), // unique reversing entry id
      description: `Reversal of: ${entry.description}`,
      recordedBy: caller.user.id,
    });
  });

  revalidatePath('/admin/finance');
}

export async function runReconciliation() {
  await requireAdmin();
  const mismatches = await reconcile();
  return mismatches;
}
