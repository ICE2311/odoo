import Link from 'next/link';
import { getCaller } from '@/server/auth/guards';
import { 
  LayoutDashboard, ShoppingBag, Ticket, User, LogOut, 
  HeartHandshake, QrCode, Shield, ShoppingCart, Receipt 
} from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const caller = await getCaller();
  const session = caller.kind === 'user' ? { user: caller.user } : null;

  if (!session?.user) {
    redirect('/login');
  }

  const isMember = caller.isMember;
  const isAdmin = caller.isAdmin;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm font-bold text-sm">
              S
            </div>
            <div>
              <span className="font-bold text-foreground tracking-tight text-sm block leading-tight">
                Skyline Student Association
              </span>
              <span className="text-[10px] text-muted-foreground font-medium block">
                Member Portal
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                Admin Console
              </Link>
            )}

            {(isMember || isAdmin) && (
              <Link
                href="/door"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold border border-emerald-200 transition-colors"
              >
                <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                Check-In
              </Link>
            )}

            <Link
              href="/api/auth/signout"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-card/50 hidden md:block shrink-0">
          <nav className="p-4 space-y-1.5 sticky top-16">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              My Student Account
            </div>

            <Link
              href="/account"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-primary" />
              Overview
            </Link>
            <Link
              href="/account/membership"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Ticket className="w-4 h-4 text-secondary" />
              Digital Member Pass
            </Link>
            <Link
              href="/account/tickets"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Ticket className="w-4 h-4 text-accent" />
              My Event Tickets
            </Link>
            <Link
              href="/account/orders"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ShoppingBag className="w-4 h-4 text-primary" />
              Merch Orders
            </Link>
            <Link
              href="/account/profile"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <User className="w-4 h-4 text-secondary" />
              Profile Details
            </Link>

            {/* Member volunteer & operations links */}
            {(isMember || isAdmin) && (
              <>
                <div className="pt-4 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Member Activities
                </div>
                <Link
                  href="/volunteer"
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <HeartHandshake className="w-4 h-4 text-rose-500" />
                  Volunteer Tasks
                </Link>
                <Link
                  href="/cart"
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <ShoppingCart className="w-4 h-4 text-sky-500" />
                  Merch Cart
                </Link>
                <Link
                  href="/door"
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  Door Check-In
                </Link>
                <Link
                  href="/expenses"
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Receipt className="w-4 h-4 text-amber-500" />
                  Expenses & Ledger
                </Link>
              </>
            )}

            {isAdmin && (
              <>
                <div className="pt-4 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Administration
                </div>
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                >
                  <Shield className="w-4 h-4 text-primary" />
                  Admin Console
                </Link>
              </>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-md z-50">
        <div className="flex justify-around items-center p-2.5">
          <Link href="/account" className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary">
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          <Link href="/account/membership" className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary">
            <Ticket className="w-5 h-5" />
            <span className="text-[10px] font-medium">Pass</span>
          </Link>
          <Link href="/account/tickets" className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary">
            <QrCode className="w-5 h-5 text-emerald-600" />
            <span className="text-[10px] font-medium">Tickets</span>
          </Link>
          <Link href="/account/orders" className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary">
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px] font-medium">Merch</span>
          </Link>
          {isAdmin ? (
            <Link href="/admin" className="flex flex-col items-center gap-0.5 text-primary">
              <Shield className="w-5 h-5" />
              <span className="text-[10px] font-bold">Admin</span>
            </Link>
          ) : (
            <Link href="/account/profile" className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary">
              <User className="w-5 h-5" />
              <span className="text-[10px] font-medium">Profile</span>
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
