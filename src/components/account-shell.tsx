'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingBag, Ticket, User, LogOut, 
  HeartHandshake, QrCode, Shield, ShoppingCart, Receipt, 
  Menu, X, Sparkles, ChevronRight, PlusCircle, ArrowUpRight, Wallet
} from 'lucide-react';

interface AccountShellProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  isAdmin: boolean;
  isTreasurer?: boolean;
  isMember: boolean;
  children: React.ReactNode;
}

export function AccountShell({ user, isAdmin, isTreasurer, isMember, children }: AccountShellProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on path navigation
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  // Lock background scroll when drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileDrawerOpen]);

  const isExactActive = (href: string) => pathname === href;
  const isPrefixActive = (href: string) => {
    if (href === '/account') return pathname === '/account';
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ─── TOP HEADER ─── */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Drawer Trigger */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              className="md:hidden p-2 rounded-xl text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
              aria-label="Toggle navigation drawer"
            >
              {mobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm font-bold text-sm group-hover:scale-105 transition-transform">
                S
              </div>
              <div>
                <span className="font-bold text-foreground tracking-tight text-sm block leading-tight">
                  Skyline SSA
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                  {isAdmin ? 'Admin & Member Portal' : isTreasurer ? 'Treasurer Portal' : 'Member Portal'}
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Merch Cart Quick Link */}
            <Link
              href="/cart"
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-4 h-4" />
            </Link>

            {isAdmin ? (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin Console</span>
              </Link>
            ) : isTreasurer ? (
              <Link
                href="/admin/finance"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-colors"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Treasury Portal</span>
              </Link>
            ) : null}

            {(isMember || isAdmin) && (
              <Link
                href="/door"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold border border-emerald-200 transition-colors"
              >
                <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Check-In</span>
              </Link>
            )}

            <Link
              href="/api/auth/signout"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── BODY CONTAINER ─── */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        {/* Desktop Sidebar */}
        <aside className="w-64 border-r border-border bg-card/40 hidden md:block shrink-0">
          <nav className="p-4 space-y-1.5 sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-2">
              My Student Account
            </div>

            <Link
              href="/account"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isExactActive('/account')
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-primary shrink-0" />
              <span>Overview</span>
            </Link>

            <Link
              href="/account/membership"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isPrefixActive('/account/membership')
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Ticket className="w-4 h-4 text-secondary shrink-0" />
              <span>Digital Member Pass</span>
            </Link>

            <Link
              href="/account/tickets"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isPrefixActive('/account/tickets')
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <QrCode className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>My Event Tickets</span>
            </Link>

            <Link
              href="/account/orders"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isPrefixActive('/account/orders')
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-primary shrink-0" />
              <span>Merch Orders</span>
            </Link>

            <Link
              href="/account/profile"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isPrefixActive('/account/profile')
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <User className="w-4 h-4 text-secondary shrink-0" />
              <span>Profile Details</span>
            </Link>

            {/* Member volunteer & operations links */}
            {(isMember || isAdmin) && (
              <>
                <div className="pt-4 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1">
                  Member Activities
                </div>
                <Link
                  href="/volunteer"
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isPrefixActive('/volunteer')
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <HeartHandshake className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Volunteer Tasks</span>
                </Link>
                <Link
                  href="/cart"
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isExactActive('/cart')
                      ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/40'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4 text-sky-500 shrink-0" />
                  <span>Merch Cart</span>
                </Link>
                <Link
                  href="/door"
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isPrefixActive('/door')
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Door Check-In</span>
                </Link>
                <Link
                  href="/account/expenses"
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isExactActive('/account/expenses')
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Receipt className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Expenses & Ledger</span>
                </Link>
                <Link
                  href="/account/expenses/new"
                  className={`flex items-center gap-2 pl-9 pr-3.5 py-1 text-xs font-semibold transition-colors ${
                    isExactActive('/account/expenses/new')
                      ? 'text-amber-700 font-bold underline'
                      : 'text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:underline'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>File Ledger Claim</span>
                </Link>
              </>
            )}

            {isAdmin ? (
              <>
                <div className="pt-4 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1">
                  Administration
                </div>
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-primary hover:bg-primary/10 transition-colors"
                >
                  <Shield className="w-4 h-4 text-primary shrink-0" />
                  <span>Admin Console</span>
                </Link>
              </>
            ) : isTreasurer ? (
              <>
                <div className="pt-4 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1">
                  Treasury
                </div>
                <Link
                  href="/admin/finance"
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                >
                  <Wallet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Treasury Portal</span>
                </Link>
              </>
            ) : null}
          </nav>
        </aside>

        {/* Main Content with Mobile Bottom Padding */}
        <main className="flex-1 overflow-auto pb-24 md:pb-8">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* ─── MOBILE BOTTOM BAR ─── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-md z-40 safe-area-bottom">
        <div className="flex justify-around items-center px-2 py-2">
          <Link 
            href="/account" 
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-colors ${
              isExactActive('/account') ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none">Home</span>
          </Link>
          
          <Link 
            href="/account/membership" 
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-colors ${
              isPrefixActive('/account/membership') ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Ticket className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none">Pass</span>
          </Link>

          <Link 
            href="/account/tickets" 
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-colors ${
              isPrefixActive('/account/tickets') ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <QrCode className="w-5 h-5 text-emerald-600" />
            <span className="text-[10px] font-medium leading-none">Tickets</span>
          </Link>

          <Link 
            href="/account/orders" 
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-colors ${
              isPrefixActive('/account/orders') ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none">Merch</span>
          </Link>

          {/* "More" Trigger */}
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-colors ${
              mobileDrawerOpen 
                ? 'text-primary font-bold' 
                : isPrefixActive('/volunteer') || isPrefixActive('/account/expenses') || isPrefixActive('/account/profile') || isPrefixActive('/cart')
                  ? 'text-primary font-bold'
                  : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-label="Open more navigation options"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none">More</span>
          </button>
        </div>
      </nav>

      {/* ─── MOBILE DRAWER (SLIDE-OVER / SHEET) ─── */}
      {mobileDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileDrawerOpen(false)}
        >
          <div 
            className="fixed inset-y-0 right-0 w-full max-w-xs bg-card border-l border-border shadow-2xl p-5 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm">
                    {user.name?.[0] || user.email[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm truncate max-w-[170px]">
                      {user.name || 'Member'}
                    </h3>
                    <p className="text-[11px] text-muted-foreground truncate max-w-[170px]">
                      {user.email}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                  isAdmin 
                    ? 'bg-primary/10 text-primary' 
                    : isTreasurer
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : isMember 
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                        : 'bg-muted text-muted-foreground'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {isAdmin ? 'Club Admin' : isTreasurer ? 'Treasurer' : isMember ? 'Active Member' : 'Student Guest'}
                </span>
              </div>

              {/* Member Operations & Activities */}
              {(isMember || isAdmin) && (
                <div className="space-y-1">
                  <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1">
                    Member Activities
                  </div>

                  <Link
                    href="/volunteer"
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      isPrefixActive('/volunteer')
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40'
                        : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <HeartHandshake className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Volunteer Tasks</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                  </Link>

                  <Link
                    href="/account/expenses"
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      isExactActive('/account/expenses')
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40'
                        : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Receipt className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Expenses & Ledger</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                  </Link>

                  <Link
                    href="/account/expenses/new"
                    className="flex items-center gap-2 pl-8 pr-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:underline transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>File Ledger Claim</span>
                  </Link>

                  <Link
                    href="/cart"
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      isExactActive('/cart')
                        ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/40'
                        : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <ShoppingCart className="w-4 h-4 text-sky-500 shrink-0" />
                      <span>Merch Cart</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                  </Link>

                  <Link
                    href="/door"
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      isPrefixActive('/door')
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40'
                        : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <QrCode className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Door Check-In</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                  </Link>
                </div>
              )}

              {/* Personal Settings */}
              <div className="space-y-1">
                <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1">
                  Account Settings
                </div>

                <Link
                  href="/account/profile"
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isPrefixActive('/account/profile')
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-secondary shrink-0" />
                    <span>Profile Details</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                </Link>

                <Link
                  href="/account/orders"
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isPrefixActive('/account/orders')
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag className="w-4 h-4 text-primary shrink-0" />
                    <span>Merch Orders</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                </Link>

                {isAdmin ? (
                  <Link
                    href="/admin"
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold bg-primary/10 text-primary hover:bg-primary/15 transition-colors mt-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-4 h-4 text-primary shrink-0" />
                      <span>Admin Console</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-primary" />
                  </Link>
                ) : isTreasurer ? (
                  <Link
                    href="/admin/finance"
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15 transition-colors mt-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <Wallet className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Treasury Portal</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  </Link>
                ) : null}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-border space-y-2">
              <Link
                href="/"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Back to Main Website</span>
              </Link>

              <Link
                href="/api/auth/signout"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

