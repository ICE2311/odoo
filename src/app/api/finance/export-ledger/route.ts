import { requireFinanceAccess } from '@/server/auth/guards';
import { db } from '@/server/db';
import { ledgerEntries, users } from '@/server/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(req: Request) {
  await requireFinanceAccess();
  
  const entries = await db.select({
    id: ledgerEntries.id,
    date: ledgerEntries.occurredAt,
    description: ledgerEntries.description,
    category: ledgerEntries.category,
    method: ledgerEntries.method,
    direction: ledgerEntries.direction,
    amountPaise: ledgerEntries.amountPaise,
    recordedByEmail: users.email
  }).from(ledgerEntries)
    .leftJoin(users, eq(ledgerEntries.recordedBy, users.id))
    .orderBy(desc(ledgerEntries.occurredAt));

  const headers = ['Date (IST)', 'Description', 'Category', 'Method', 'In (Rs)', 'Out (Rs)', 'Recorded By'];
  const rows = entries.map(e => [
    e.date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    `"${(e.description || '').replace(/"/g, '""')}"`,
    e.category,
    e.method,
    e.direction === 'in' ? (e.amountPaise / 100).toFixed(2) : '',
    e.direction === 'out' ? (e.amountPaise / 100).toFixed(2) : '',
    e.recordedByEmail || ''
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="ledger.csv"'
    }
  });
}
