import { getOverviewDashboardData } from '@/server/data/admin/finance';
import { getCaller } from '@/server/auth/guards';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminDashboardPage() {
  const caller = await getCaller();
  if (caller.kind === 'user' && caller.user.role === 'treasurer') {
    redirect('/admin/finance');
  }

  const data = await getOverviewDashboardData();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Admin Overview Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/admin/finance" className="block border border-border p-4 rounded-2xl bg-card shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/50">
          <div className="text-sm text-muted-foreground">Balance</div>
          <div className="text-2xl font-bold">₹{(data.balance / 100).toFixed(2)}</div>
        </Link>
        <Link href="/admin/users" className="block border border-border p-4 rounded-2xl bg-card shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/50">
          <div className="text-sm text-muted-foreground">Active Members</div>
          <div className="text-2xl font-bold text-success">{data.activeMembers}</div>
          <div className="text-xs text-warning-foreground mt-1">{data.expiringMembers} expiring in 30d</div>
        </Link>
        <Link href="/admin/expenses" className="block border border-border p-4 rounded-2xl bg-card shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/50">
          <div className="text-sm text-muted-foreground">Pending Claims</div>
          <div className="text-2xl font-bold text-destructive">{data.pendingClaims.count}</div>
          <div className="text-xs text-muted-foreground mt-1">Total: ₹{(data.pendingClaims.total / 100).toFixed(2)}</div>
        </Link>
        <Link href="/admin/events" className="block border border-border p-4 rounded-2xl bg-card shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/50">
          <div className="text-sm text-muted-foreground">Upcoming Events</div>
          <div className="text-2xl font-bold text-primary">{data.upcomingEvents.length}</div>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="border border-border rounded-2xl bg-card shadow-xs overflow-hidden">
            <div className="bg-muted px-4 py-2 border-b border-border font-bold flex justify-between">
              <span>Upcoming Events</span>
              <Link href="/admin/events" className="text-primary text-sm font-normal hover:underline">View all</Link>
            </div>
            <div className="p-4 space-y-2">
              {data.upcomingEvents.map(e => (
                <div key={e.id} className="flex justify-between items-center border-b border-border pb-2 last:border-0 last:pb-0">
                  <span className="font-medium">{e.title}</span>
                  <span className="text-sm text-muted-foreground">{e.sold} / {e.capacity || '∞'} sold</span>
                </div>
              ))}
              {data.upcomingEvents.length === 0 && <div className="text-muted-foreground text-sm">No upcoming events.</div>}
            </div>
          </div>

          <div className="border border-border rounded-2xl bg-card shadow-xs overflow-hidden">
            <div className="bg-muted px-4 py-2 border-b border-border font-bold flex justify-between">
              <span className="text-destructive">Low Stock Variants</span>
              <Link href="/admin/shop" className="text-primary text-sm font-normal hover:underline">Manage</Link>
            </div>
            <div className="p-4 space-y-2">
              {data.lowStock.map(s => (
                <div key={s.id} className="flex justify-between items-center border-b border-border pb-2 last:border-0 last:pb-0">
                  <span className="font-medium">{s.productName} ({s.label})</span>
                  <span className="text-sm font-bold text-destructive">{s.stock} left</span>
                </div>
              ))}
              {data.lowStock.length === 0 && <div className="text-muted-foreground text-sm">No low stock items.</div>}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border border-border rounded-2xl bg-card shadow-xs overflow-hidden">
            <div className="bg-muted px-4 py-2 border-b border-border font-bold flex justify-between">
              <span className="text-warning-foreground">At-Risk Fundraisers</span>
              <Link href="/admin/fundraisers" className="text-primary text-sm font-normal hover:underline">View all</Link>
            </div>
            <div className="p-4 space-y-2">
              {data.atRiskFundraisers.map(f => (
                <div key={f.id} className="flex flex-col border-b border-border pb-2 last:border-0 last:pb-0">
                  <span className="font-medium">{f.name}</span>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-success">Takings: ₹{(f.takings / 100).toFixed(2)}</span>
                    <span className="text-destructive font-bold">Expenses: ₹{(f.expenses / 100).toFixed(2)}</span>
                  </div>
                </div>
              ))}
              {data.atRiskFundraisers.length === 0 && <div className="text-muted-foreground text-sm">No at-risk fundraisers.</div>}
            </div>
          </div>

          <div className="border border-border rounded-2xl bg-card shadow-xs overflow-hidden">
            <div className="bg-muted px-4 py-2 border-b border-border font-bold flex justify-between">
              <span>Latest Announcements</span>
              <Link href="/admin/announcements" className="text-primary text-sm font-normal hover:underline">View all</Link>
            </div>
            <div className="p-4 space-y-2">
              {data.announcements.map((a: any) => (
                <div key={a.id} className="flex justify-between items-center border-b border-border pb-2 last:border-0 last:pb-0">
                  <span className="font-medium truncate">{a.title}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">{a.status}</span>
                </div>
              ))}
              {data.announcements.length === 0 && <div className="text-muted-foreground text-sm">No announcements.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
