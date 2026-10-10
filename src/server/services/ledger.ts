import { db } from '@/server/db';
import { ledgerEntries } from '@/server/db/schema';
import { sql } from 'drizzle-orm';
import { Caller } from '@/server/auth/guards';

type LedgerEntryInput = {
  direction: 'in' | 'out';
  amountPaise: number;
  category: 'membership_dues' | 'ticket_sales' | 'merch_sales' | 'fundraiser_income' | 'expense_reimbursement' | 'refund' | 'manual_income' | 'manual_expense' | 'test_income';
  method: 'razorpay' | 'cash' | 'upi_manual' | 'bank';
  sourceType: string;
  sourceId: string;
  eventId?: string;
  fundraiserId?: string;
  description?: string;
  recordedBy?: string;
};

export async function recordEntry(tx: any, input: LedgerEntryInput) {
  return await tx.insert(ledgerEntries).values({
    direction: input.direction,
    amountPaise: input.amountPaise,
    category: input.category,
    method: input.method,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    eventId: input.eventId,
    fundraiserId: input.fundraiserId,
    description: input.description,
    recordedBy: input.recordedBy,
  }).onConflictDoNothing({
    target: [ledgerEntries.sourceType, ledgerEntries.sourceId, ledgerEntries.category, ledgerEntries.direction],
  });
}

export async function getBalance() {
  const result = await db.execute(sql`
    SELECT
      COALESCE(SUM(CASE WHEN direction = 'in' THEN amount_paise ELSE 0 END), 0) -
      COALESCE(SUM(CASE WHEN direction = 'out' THEN amount_paise ELSE 0 END), 0) as balance
    FROM ledger_entries
  `);
  return Number(result.rows[0].balance);
}
