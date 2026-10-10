import Link from 'next/link';
import { LayoutDashboard, Users, Calendar, ShoppingBag, ShoppingCart, HeartHandshake, FileText, Banknote, Settings, Activity, ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { requireAdmin } from '@/server/auth/guards';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const caller = await requireAdmin();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 backdrop-blur flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2 w-full">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Skyline Admin</p>
              <p className="text-sm font-semibold text-foreground">Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Users className="w-5 h-5" />
            Users & Members
          </Link>
          <Link
            href="/admin/events"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Calendar className="w-5 h-5" />
            Events
          </Link>
          <Link
            href="/admin/shop"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            Shop
          </Link>
          <Link
            href="/admin/orders"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            Orders
          </Link>
          <Link
            href="/admin/expenses"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <FileText className="w-5 h-5" />
            Expenses
          </Link>
          <Link
            href="/admin/fundraisers"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <HeartHandshake className="w-5 h-5" />
            Fundraisers
          </Link>
          <Link
            href="/admin/finance"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Banknote className="w-5 h-5" />
            Finance
          </Link>

          <div className="my-4 border-t border-border pt-4 space-y-1">
            <Link
              href="/admin/audit-log"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Activity className="w-5 h-5" />
              Audit Log
            </Link>
            <Link
              href="/admin/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Settings className="w-5 h-5" />
              Settings
            </Link>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-border p-4 space-y-2">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </Link>
          <Link
            href="/api/auth/signout"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur flex items-center px-8">
          <div className="flex items-center justify-between w-full">
            <h1 className="text-lg font-semibold text-foreground">Administration</h1>
            <p className="text-sm text-muted-foreground">{caller.user.email}</p>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
