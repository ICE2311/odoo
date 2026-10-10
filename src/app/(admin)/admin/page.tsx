import { getOverviewDashboardData } from '@/server/data/admin/finance';
import Link from 'next/link';

export default async function AdminDashboardPage() {
  const data = await getOverviewDashboardData();

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Admin Overview Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/admin/finance" className="block border p-4 rounded bg-white shadow hover:border-blue-500">
          <div className="text-sm text-gray-500">Balance</div>
          <div className="text-2xl font-bold">₹{(data.balance / 100).toFixed(2)}</div>
        </Link>
        <Link href="/admin/users" className="block border p-4 rounded bg-white shadow hover:border-blue-500">
          <div className="text-sm text-gray-500">Active Members</div>
          <div className="text-2xl font-bold text-green-600">{data.activeMembers}</div>
          <div className="text-xs text-orange-500 mt-1">{data.expiringMembers} expiring in 30d</div>
        </Link>
        <Link href="/admin/expenses" className="block border p-4 rounded bg-white shadow hover:border-blue-500">
          <div className="text-sm text-gray-500">Pending Claims</div>
          <div className="text-2xl font-bold text-red-600">{data.pendingClaims.count}</div>
          <div className="text-xs text-gray-500 mt-1">Total: ₹{(data.pendingClaims.total / 100).toFixed(2)}</div>
        </Link>
        <Link href="/admin/events" className="block border p-4 rounded bg-white shadow hover:border-blue-500">
          <div className="text-sm text-gray-500">Upcoming Events</div>
          <div className="text-2xl font-bold text-blue-600">{data.upcomingEvents.length}</div>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="border rounded bg-white shadow overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b font-bold flex justify-between">
              <span>Upcoming Events</span>
              <Link href="/admin/events" className="text-blue-500 text-sm font-normal">View all</Link>
            </div>
            <div className="p-4 space-y-2">
              {data.upcomingEvents.map(e => (
                <div key={e.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                  <span className="font-medium">{e.title}</span>
                  <span className="text-sm text-gray-500">{e.sold} / {e.capacity || '∞'} sold</span>
                </div>
              ))}
              {data.upcomingEvents.length === 0 && <div className="text-gray-500 text-sm">No upcoming events.</div>}
            </div>
          </div>

          <div className="border rounded bg-white shadow overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b font-bold flex justify-between">
              <span className="text-red-600">Low Stock Variants</span>
              <Link href="/admin/shop" className="text-blue-500 text-sm font-normal">Manage</Link>
            </div>
            <div className="p-4 space-y-2">
              {data.lowStock.map(s => (
                <div key={s.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                  <span className="font-medium">{s.productName} ({s.label})</span>
                  <span className="text-sm font-bold text-red-600">{s.stock} left</span>
                </div>
              ))}
              {data.lowStock.length === 0 && <div className="text-gray-500 text-sm">No low stock items.</div>}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border rounded bg-white shadow overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b font-bold flex justify-between">
              <span className="text-orange-600">At-Risk Fundraisers</span>
              <Link href="/admin/fundraisers" className="text-blue-500 text-sm font-normal">View all</Link>
            </div>
            <div className="p-4 space-y-2">
              {data.atRiskFundraisers.map(f => (
                <div key={f.id} className="flex flex-col border-b pb-2 last:border-0 last:pb-0">
                  <span className="font-medium">{f.name}</span>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-green-600">Takings: ₹{(f.takings / 100).toFixed(2)}</span>
                    <span className="text-red-600 font-bold">Expenses: ₹{(f.expenses / 100).toFixed(2)}</span>
                  </div>
                </div>
              ))}
              {data.atRiskFundraisers.length === 0 && <div className="text-gray-500 text-sm">No at-risk fundraisers.</div>}
            </div>
          </div>

          <div className="border rounded bg-white shadow overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b font-bold flex justify-between">
              <span>Latest Announcements</span>
            </div>
            <div className="p-4 space-y-2">
              {data.announcements.map((a: any) => (
                <div key={a.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                  <span className="font-medium truncate">{a.title}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{a.status}</span>
                </div>
              ))}
              {data.announcements.length === 0 && <div className="text-gray-500 text-sm">No announcements.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
