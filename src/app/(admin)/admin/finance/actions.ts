'use server'

import { requireAdmin } from '@/server/auth/guards';
import { db } from '@/server/db';
import { recordEntry } from '@/server/services/ledger';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

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
