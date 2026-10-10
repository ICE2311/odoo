import { requireAdmin } from '@/server/auth/guards';
import { getBalance } from '@/server/services/ledger';
import { db } from '@/server/db';
import { ledgerEntries } from '@/server/db/schema';
import { desc } from 'drizzle-orm';
import { addManualEntry } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default async function FinancePage() {
  await requireAdmin();
  const balance = await getBalance();
  const entries = await db.query.ledgerEntries.findMany({
    orderBy: [desc(ledgerEntries.occurredAt)],
    limit: 20
  });

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Finance Dashboard</h1>
      <div className="text-xl">Balance: ₹{(balance / 100).toFixed(2)}</div>
      
      <form action={addManualEntry} className="space-y-4 border p-4 rounded">
        <h2 className="font-bold">Manual Ledger Entry</h2>
        <select name="direction" className="border p-2 w-full">
          <option value="in">Income (In)</option>
          <option value="out">Expense (Out)</option>
        </select>
        <Input type="number" name="amount" placeholder="Amount (₹)" required />
        <select name="method" className="border p-2 w-full">
          <option value="cash">Cash</option>
          <option value="upi_manual">UPI</option>
          <option value="bank">Bank</option>
        </select>
        <Input type="text" name="description" placeholder="Description" required />
        <Button type="submit">Record Entry</Button>
      </form>

      <table className="w-full text-left">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Desc</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(e => (
            <tr key={e.id}>
              <td>{e.occurredAt.toLocaleString()}</td>
              <td>{e.direction === 'in' ? 'IN' : 'OUT'}</td>
              <td>₹{(e.amountPaise / 100).toFixed(2)}</td>
              <td>{e.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
