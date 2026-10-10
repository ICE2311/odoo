import { getSemesterReport, getPerEventPnL, getPerFundraiserPnL, getMerchReport, getMembershipReport, reconcile } from '@/server/data/admin/finance';
import { runReconciliation } from '../actions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function FinanceReportsPage({ searchParams }: { searchParams: Promise<{ runReconcile?: string }> }) {
  const semesterStart = new Date(new Date().getFullYear(), 7, 1); // Mock Fall sem start
  
  const [semester, eventPnL, frPnL, merch, membership] = await Promise.all([
    getSemesterReport(semesterStart),
    getPerEventPnL(),
    getPerFundraiserPnL(),
    getMerchReport(),
    getMembershipReport()
  ]);

  let mismatches: string[] | null = null;
  const sp = await searchParams;
  if (sp.runReconcile === 'true') {
    mismatches = await reconcile();
  }

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-12">
      <div className="flex justify-between items-center print:hidden">
        <h1 className="text-2xl font-bold">Finance Reports</h1>
        <div className="space-x-2">
          <Link href="/admin/finance/reports?runReconcile=true" className="border px-4 py-2 rounded hover:bg-gray-50">Run Reconcile Check</Link>
          <Button onClick={typeof window !== 'undefined' ? () => window.print() : undefined}>Print to PDF</Button>
        </div>
      </div>

      {mismatches !== null && (
        <div className="p-4 border rounded bg-gray-50 print:hidden">
          <h2 className="text-lg font-bold mb-2">Reconciliation Status</h2>
          {mismatches.length === 0 ? (
            <p className="text-green-600 font-bold">✅ All modules match the ledger perfectly.</p>
          ) : (
            <div className="text-red-600">
              <p className="font-bold mb-2">❌ Found {mismatches.length} mismatches:</p>
              <ul className="list-disc pl-5">
                {mismatches.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      <section>
        <h2 className="text-xl font-bold mb-4 border-b pb-2">Semester Report (Since Aug 1)</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="border p-4 rounded">
            <h3 className="font-bold mb-2">Money In</h3>
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(semester.inCategories).map(([cat, val]) => (
                  <tr key={cat}><td>{cat}</td><td className="text-right text-green-600">₹{(val / 100).toFixed(2)}</td></tr>
                ))}
                <tr className="font-bold border-t"><td>Total In</td><td className="text-right text-green-600">₹{(semester.totalIn / 100).toFixed(2)}</td></tr>
              </tbody>
            </table>
          </div>
          <div className="border p-4 rounded">
            <h3 className="font-bold mb-2">Money Out</h3>
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(semester.outCategories).map(([cat, val]) => (
                  <tr key={cat}><td>{cat}</td><td className="text-right text-red-600">₹{(val / 100).toFixed(2)}</td></tr>
                ))}
                <tr className="font-bold border-t"><td>Total Out</td><td className="text-right text-red-600">₹{(semester.totalOut / 100).toFixed(2)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-4 text-lg font-bold bg-gray-100 p-4 rounded">
          Opening Balance: ₹{(semester.openingBalance / 100).toFixed(2)} <br />
          Closing Balance: ₹{(semester.closingBalance / 100).toFixed(2)}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4 border-b pb-2">Per-Event P&L</h2>
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-2">Event</th>
              <th className="p-2">Tickets Sold / Cap</th>
              <th className="p-2">Attendance %</th>
              <th className="p-2">Revenue</th>
              <th className="p-2">Refunds</th>
              <th className="p-2">Expenses</th>
              <th className="p-2">Profit</th>
            </tr>
          </thead>
          <tbody>
            {eventPnL.map(e => (
              <tr key={e.id} className="border-b">
                <td className="p-2">{e.title}</td>
                <td className="p-2">{e.ticketsSold} / {e.capacity || '-'}</td>
                <td className="p-2">{e.attendancePercent}%</td>
                <td className="p-2 text-green-600">₹{(e.ticketRevenue / 100).toFixed(2)}</td>
                <td className="p-2 text-red-600">₹{(e.refunds / 100).toFixed(2)}</td>
                <td className="p-2 text-red-600">₹{(e.expenses / 100).toFixed(2)}</td>
                <td className="p-2 font-bold">₹{(e.profit / 100).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4 border-b pb-2">Per-Fundraiser P&L</h2>
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-2">Fundraiser</th>
              <th className="p-2">Goal</th>
              <th className="p-2">Takings</th>
              <th className="p-2">Expenses</th>
              <th className="p-2">Profit</th>
              <th className="p-2">% of Goal</th>
            </tr>
          </thead>
          <tbody>
            {frPnL.map(f => (
              <tr key={f.id} className="border-b">
                <td className="p-2">{f.name}</td>
                <td className="p-2">₹{(f.goal / 100).toFixed(2)}</td>
                <td className="p-2 text-green-600">₹{(f.takings / 100).toFixed(2)}</td>
                <td className="p-2 text-red-600">₹{(f.expenses / 100).toFixed(2)}</td>
                <td className="p-2 font-bold">₹{(f.profit / 100).toFixed(2)}</td>
                <td className="p-2">{f.goal > 0 ? Math.round((f.profit / f.goal) * 100) : 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4 border-b pb-2">Merch Sales & Stock</h2>
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-2">Product</th>
              <th className="p-2">Variant</th>
              <th className="p-2">Stock On Hand</th>
              <th className="p-2">Units Sold</th>
              <th className="p-2">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {merch.map(m => (
              <tr key={m.variantId} className="border-b">
                <td className="p-2">{m.productName}</td>
                <td className="p-2">{m.variantLabel}</td>
                <td className="p-2">{m.stockOnHand}</td>
                <td className="p-2">{m.unitsSold}</td>
                <td className="p-2 font-bold text-green-600">₹{(m.revenue / 100).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="break-inside-avoid">
        <h2 className="text-xl font-bold mb-4 border-b pb-2">Membership Overview</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="border p-4 rounded text-center">
            <div className="text-3xl font-bold">{membership.activeCount}</div>
            <div className="text-sm text-gray-500">Active Members</div>
          </div>
          <div className="border p-4 rounded text-center">
            <div className="text-lg font-bold">{membership.newCount} New / {membership.renewedCount} Renewed</div>
            <div className="text-sm text-gray-500">Member Composition</div>
          </div>
          <div className="border p-4 rounded text-center">
            <div className="text-lg font-bold">{membership.onlineCount} Online / {membership.cashCount} Cash</div>
            <div className="text-sm text-gray-500">Payment Methods</div>
          </div>
        </div>
      </section>
    </div>
  );
}
