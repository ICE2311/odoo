import Link from 'next/link';
import { getCaller } from '@/server/auth/guards';
import { redirect } from 'next/navigation';
import { 
  Users, Calendar, QrCode, ShoppingBag, Package,
  HeartHandshake, Receipt, Wallet, BarChart3, ShieldAlert,
  Settings, LogOut, LayoutDashboard, Globe, UserCheck, Megaphone
} from 'lucide-react';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const caller = await getCaller();
  if (caller.kind !== 'user' || caller.user.role !== 'admin') {
    redirect('/');
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-border justify-between">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm">
              S
            </div>
            <div>
              <span className="font-bold text-foreground text-sm tracking-tight block leading-tight">
                Skyline Console
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground block">
                Club Administration
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-6">
          {/* Section: Core */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
              Overview
            </div>
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-primary shrink-0" />
              Dashboard
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Users className="w-4 h-4 text-secondary shrink-0" />
              Users & Members
            </Link>
          </div>

          {/* Section: Communications */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
              Communications
            </div>
            <Link
              href="/admin/announcements"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Megaphone className="w-4 h-4 text-amber-500 shrink-0" />
              Announcements
            </Link>
          </div>

          {/* Section: Events & Activities */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
              Events & Door Staff
            </div>
            <Link
              href="/admin/events"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
              Event Catalog
            </Link>
            <Link
              href="/admin/events/check-in"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <QrCode className="w-4 h-4 text-emerald-600 shrink-0" />
              Door Check-In
            </Link>
          </div>

          {/* Section: Commerce & Merchandise */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
              Merch & Orders
            </div>
            <Link
              href="/admin/shop"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ShoppingBag className="w-4 h-4 text-accent shrink-0" />
              Products & Stock
            </Link>
            <Link
              href="/admin/orders"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Package className="w-4 h-4 text-sky-500 shrink-0" />
              Merch Orders
            </Link>
          </div>

          {/* Section: Volunteers & Fundraisers */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
              Volunteers & Tasks
            </div>
            <Link
              href="/admin/fundraisers"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <HeartHandshake className="w-4 h-4 text-rose-500 shrink-0" />
              Fundraisers
            </Link>
            <Link
              href="/admin/expenses"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Receipt className="w-4 h-4 text-amber-500 shrink-0" />
              Expense Claims
            </Link>
          </div>

          {/* Section: Treasury & Finance */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
              Treasury & Reports
            </div>
            <Link
              href="/admin/finance"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Wallet className="w-4 h-4 text-emerald-600 shrink-0" />
              Finance & Ledger
            </Link>
            <Link
              href="/admin/finance/reports"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <BarChart3 className="w-4 h-4 text-primary shrink-0" />
              Semester Reports
            </Link>
          </div>

          {/* Section: System & Settings */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
              Governance
            </div>
            <Link
              href="/admin/audit-log"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0" />
              Audit Log
            </Link>
            <Link
              href="/admin/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-500 shrink-0" />
              Settings
            </Link>
          </div>
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-border bg-card space-y-1">
          <div className="px-3 py-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span className="truncate font-semibold text-foreground">{caller.user.name || caller.user.email}</span>
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary">Admin</span>
          </div>

          <div className="grid grid-cols-2 gap-1 pt-1">
            <Link
              href="/account"
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Member
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              Site
            </Link>
          </div>

          <Link
            href="/api/auth/signout"
            className="flex items-center justify-center gap-1.5 w-full px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* ─── MAIN CONTENT VIEWPORT ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-card border-b border-border sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="md:hidden font-bold tracking-tight text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                S
              </span>
              Admin
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/events/check-in"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition-colors border border-emerald-200"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-600" />
              Check-In
            </Link>
            <Link
              href="/admin/finance"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/15 text-xs font-semibold transition-colors"
            >
              <Wallet className="w-3.5 h-3.5" />
              Ledger
            </Link>
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border text-xs font-bold text-foreground">
              {(caller.user.name?.[0] || caller.user.email[0]).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-background">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* ─── MOBILE BOTTOM BAR ─── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-md z-40">
        <div className="flex justify-around p-2.5">
          <Link href="/admin" className="p-1.5 text-muted-foreground hover:text-primary flex flex-col items-center">
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Overview</span>
          </Link>
          <Link href="/admin/events/check-in" className="p-1.5 text-muted-foreground hover:text-primary flex flex-col items-center">
            <QrCode className="w-5 h-5 text-emerald-600" />
            <span className="text-[10px] mt-0.5">CheckIn</span>
          </Link>
          <Link href="/admin/finance" className="p-1.5 text-muted-foreground hover:text-primary flex flex-col items-center">
            <Wallet className="w-5 h-5 text-primary" />
            <span className="text-[10px] mt-0.5">Ledger</span>
          </Link>
          <Link href="/admin/fundraisers" className="p-1.5 text-muted-foreground hover:text-primary flex flex-col items-center">
            <HeartHandshake className="w-5 h-5 text-rose-500" />
            <span className="text-[10px] mt-0.5">Tasks</span>
          </Link>
          <Link href="/admin/expenses" className="p-1.5 text-muted-foreground hover:text-primary flex flex-col items-center">
            <Receipt className="w-5 h-5 text-amber-500" />
            <span className="text-[10px] mt-0.5">Claims</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
