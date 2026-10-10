import { getFinanceDashboardData, getLedger } from '@/server/data/admin/finance';
import { FinanceCharts } from './FinanceCharts';
import { addManualEntry, reverseEntry } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/server/db';
import { settings } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ period?: string, customStart?: string, customEnd?: string, page?: string, category?: string }> }) {
  const sp = await searchParams;
  const period = sp.period || 'all';
  let periodStart: Date | undefined = undefined;
  let periodEnd: Date | undefined = undefined;
  const now = new Date();

  if (period === 'month') {
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  } else if (period === 'semester') {
    // try to find current semester
    const semestersResult = await db.select().from(settings).where(eq(settings.key, 'semesters'));
    if (semestersResult[0]?.valueJson) {
      const sems = semestersResult[0].valueJson as {name: string, start: string, end: string}[];
      const currentSem = sems.find(s => new Date(s.start) <= now && new Date(s.end) >= now) || sems[sems.length - 1];
      if (currentSem) {
        periodStart = new Date(currentSem.start);
        periodEnd = new Date(currentSem.end);
      }
    }
  } else if (period === 'custom') {
    if (sp.customStart) periodStart = new Date(sp.customStart);
    if (sp.customEnd) periodEnd = new Date(sp.customEnd);
  }

  const data = await getFinanceDashboardData(periodStart, periodEnd);
  
  const page = parseInt(sp.page || '1', 10);
  const categoryFilter = sp.category || 'all';
  const ledger = await getLedger(page, 20, { start: periodStart, end: periodEnd, category: categoryFilter });

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Finance Dashboard</h1>
        <Link href="/admin/finance/reports" className="text-blue-500 hover:underline">View Reports & Reconcile</Link>
      </div>
      
      <form className="flex space-x-2 items-end border p-4 rounded bg-gray-50">
        <div>
          <label className="block text-xs font-bold">Period</label>
          <select name="period" defaultValue={period} className="border p-2 rounded">
            <option value="all">All Time</option>
            <option value="month">This Month</option>
            <option value="semester">This Semester</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        {period === 'custom' && (
          <>
            <div>
              <label className="block text-xs font-bold">Start</label>
              <Input type="date" name="customStart" defaultValue={sp.customStart} />
            </div>
            <div>
              <label className="block text-xs font-bold">End</label>
              <Input type="date" name="customEnd" defaultValue={sp.customEnd} />
            </div>
          </>
        )}
        <Button type="submit">Apply</Button>
      </form>

      <div className="grid grid-cols-4 gap-4">
        <div className="border p-4 rounded bg-white shadow">
          <div className="text-sm text-gray-500">Balance (All Time)</div>
          <div className="text-2xl font-bold">₹{(data.totalBalance / 100).toFixed(2)}</div>
        </div>
        <div className="border p-4 rounded bg-white shadow">
          <div className="text-sm text-gray-500">Period In</div>
          <div className="text-2xl font-bold text-green-600">₹{(data.periodIn / 100).toFixed(2)}</div>
        </div>
        <div className="border p-4 rounded bg-white shadow">
          <div className="text-sm text-gray-500">Period Out</div>
          <div className="text-2xl font-bold text-red-600">₹{(data.periodOut / 100).toFixed(2)}</div>
        </div>
        <div className="border p-4 rounded bg-white shadow">
          <div className="text-sm text-gray-500">Period Net</div>
          <div className="text-2xl font-bold">₹{(data.periodNet / 100).toFixed(2)}</div>
        </div>
      </div>

      <FinanceCharts inByCategory={data.inByCategory} outByCategory={data.outByCategory} monthlyTrend={data.monthlyTrend} />

      <div className="border p-4 rounded space-y-4">
        <h2 className="text-xl font-bold">Manual Ledger Entry</h2>
        <form action={addManualEntry} className="flex flex-wrap gap-2 items-center">
          <select name="direction" className="border p-2 rounded w-32" required>
            <option value="in">Income (In)</option>
            <option value="out">Expense (Out)</option>
          </select>
          <Input type="number" name="amount" placeholder="Amount (₹)" required className="w-32" step="0.01" />
          <select name="method" className="border p-2 rounded w-32" required>
            <option value="cash">Cash</option>
            <option value="upi_manual">UPI</option>
            <option value="bank">Bank</option>
          </select>
          <Input type="text" name="description" placeholder="Description (required)" required className="flex-1 min-w-[200px]" />
          <Button type="submit">Record Entry</Button>
        </form>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Ledger Entries</h2>
          <div className="flex gap-2">
            <form>
              <input type="hidden" name="period" value={period} />
              <input type="hidden" name="customStart" value={sp.customStart || ''} />
              <input type="hidden" name="customEnd" value={sp.customEnd || ''} />
              <select name="category" defaultValue={categoryFilter} className="border p-2 rounded mr-2" >
                <option value="all">All Categories</option>
                <option value="membership_dues">Membership Dues</option>
                <option value="ticket_sales">Ticket Sales</option>
                <option value="merch_sales">Merch Sales</option>
                <option value="fundraiser_income">Fundraiser Income</option>
                <option value="expense_reimbursement">Expense Reimbursement</option>
                <option value="refund">Refund</option>
                <option value="manual_income">Manual Income</option>
                <option value="manual_expense">Manual Expense</option>
              </select>
              <Button type="submit">Filter</Button>
            </form>
            <Link href="/api/finance/export-ledger" target="_blank" className="bg-green-600 text-white px-4 py-2 rounded">Export CSV</Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b">
                <th className="p-2">Date</th>
                <th className="p-2">Description</th>
                <th className="p-2">Category</th>
                <th className="p-2">Method</th>
                <th className="p-2">In</th>
                <th className="p-2">Out</th>
                <th className="p-2">Recorded By</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {ledger.entries.map((e: any) => (
                <tr key={e.id} className="border-b text-sm">
                  <td className="p-2 whitespace-nowrap">{e.occurredAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
                  <td className="p-2">{e.description}</td>
                  <td className="p-2">{e.category}</td>
                  <td className="p-2">{e.method}</td>
                  <td className="p-2 text-green-600">{e.direction === 'in' ? `₹${(e.amountPaise / 100).toFixed(2)}` : ''}</td>
                  <td className="p-2 text-red-600">{e.direction === 'out' ? `₹${(e.amountPaise / 100).toFixed(2)}` : ''}</td>
                  <td className="p-2">{e.recordedByData?.name || e.recordedByData?.email || '-'}</td>
                  <td className="p-2">
                    <form action={async () => {
                      'use server';
                      await reverseEntry(e.id);
                    }}>
                      <Button variant="outline" size="sm" type="submit" disabled={e.description?.startsWith('Reversal of:')}>Reverse</Button>
                    </form>
                  </td>
                </tr>
              ))}
              {ledger.entries.length === 0 && (
                <tr><td colSpan={8} className="p-4 text-center">No entries found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Page {page} of {ledger.totalPages || 1} ({ledger.totalCount} entries)</span>
          <div className="space-x-2">
            {page > 1 && <Link href={`?period=${period}&page=${page - 1}&category=${categoryFilter}`} className="border px-3 py-1 rounded">Previous</Link>}
            {page < ledger.totalPages && <Link href={`?period=${period}&page=${page + 1}&category=${categoryFilter}`} className="border px-3 py-1 rounded">Next</Link>}
          </div>
        </div>
      </div>
    </div>
  );
}
