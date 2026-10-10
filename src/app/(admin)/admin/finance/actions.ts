'use server'

import { requireAdmin } from '@/server/auth/guards';
import { db } from '@/server/db';
import { ledgerEntries } from '@/server/db/schema';
import { recordEntry } from '@/server/services/ledger';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import { reconcile } from '@/server/data/admin/finance';

export async function addManualEntry(formData: FormData) {
  const caller = await requireAdmin();
  
  const direction = formData.get('direction') as 'in' | 'out';
  const amount = Number(formData.get('amount')) * 100;
  const method = formData.get('method') as 'cash' | 'upi_manual' | 'bank';
  const description = formData.get('description') as string;

  await db.transaction(async (tx) => {
    await recordEntry(tx, {
      direction,
      amountPaise: amount,
      category: direction === 'in' ? 'manual_income' : 'manual_expense',
      method,
      sourceType: 'manual_entry',
      sourceId: uuidv4(),
      description,
      recordedBy: caller.user.id
    });
  });

  revalidatePath('/admin/finance');
}

export async function reverseEntry(id: string) {
  const caller = await requireAdmin();
  
  const entry = await db.query.ledgerEntries.findFirst({
    where: eq(ledgerEntries.id, id)
  });
  
  if (!entry) throw new Error("Entry not found");
  
  await db.transaction(async (tx) => {
    await recordEntry(tx, {
      direction: entry.direction === 'in' ? 'out' : 'in',
      amountPaise: entry.amountPaise,
      category: entry.category,
      method: entry.method,
      sourceType: entry.sourceType,
      sourceId: uuidv4(), // unique reversing entry id
      description: `Reversal of: ${entry.description}`,
      recordedBy: caller.user.id
    });
  });

  revalidatePath('/admin/finance');
}

export async function runReconciliation() {
  await requireAdmin();
  const mismatches = await reconcile();
  return mismatches;
}
