'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, Calendar, QrCode, ShoppingBag, Package,
  HeartHandshake, Receipt, Wallet, BarChart3, ShieldAlert,
  Settings, LogOut, LayoutDashboard, Globe, UserCheck, Megaphone,
  Menu, X, ChevronRight, Shield
} from 'lucide-react';

interface AdminShellProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  children: React.ReactNode;
}

export function AdminShell({ user, children }: AdminShellProps) {
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
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  const isTreasurer = user.role === 'treasurer';

  const navSections = isTreasurer
    ? [
        {
          title: 'Treasury & Finance',
          items: [
            { href: '/admin/finance', label: 'Finance & Ledger', icon: Wallet, exact: true, color: 'text-emerald-600' },
            { href: '/admin/finance/reports', label: 'Semester Reports', icon: BarChart3, exact: false, color: 'text-primary' },
            { href: '/admin/expenses', label: 'Expense Claims', icon: Receipt, exact: false, color: 'text-amber-500' },
          ],
        },
      ]
    : [
        {
          title: 'Overview',
          items: [
            { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true, color: 'text-primary' },
            { href: '/admin/users', label: 'Users & Members', icon: Users, exact: false, color: 'text-secondary' },
          ],
        },
        {
          title: 'Communications',
          items: [
            { href: '/admin/announcements', label: 'Announcements', icon: Megaphone, exact: false, color: 'text-amber-500' },
          ],
        },
        {
          title: 'Events & Door Staff',
          items: [
            { href: '/admin/events', label: 'Event Catalog', icon: Calendar, exact: true, color: 'text-indigo-500' },
            { href: '/admin/events/check-in', label: 'Door Check-In', icon: QrCode, exact: false, color: 'text-emerald-600' },
          ],
        },
        {
          title: 'Merch & Orders',
          items: [
            { href: '/admin/shop', label: 'Products & Stock', icon: ShoppingBag, exact: false, color: 'text-accent' },
            { href: '/admin/orders', label: 'Merch Orders', icon: Package, exact: false, color: 'text-sky-500' },
          ],
        },
        {
          title: 'Volunteers & Tasks',
          items: [
            { href: '/admin/fundraisers', label: 'Fundraisers', icon: HeartHandshake, exact: false, color: 'text-rose-500' },
            { href: '/admin/expenses', label: 'Expense Claims', icon: Receipt, exact: false, color: 'text-amber-500' },
          ],
        },
        {
          title: 'Treasury & Reports',
          items: [
            { href: '/admin/finance', label: 'Finance & Ledger', icon: Wallet, exact: true, color: 'text-emerald-600' },
            { href: '/admin/finance/reports', label: 'Semester Reports', icon: BarChart3, exact: false, color: 'text-primary' },
          ],
        },
      ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-border justify-between">
          <Link href={isTreasurer ? "/admin/finance" : "/admin"} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm">
              {isTreasurer ? 'T' : 'S'}
            </div>
            <div>
              <span className="font-bold text-foreground text-sm tracking-tight block leading-tight">
                {isTreasurer ? 'Skyline Treasury' : 'Skyline Console'}
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground block">
                {isTreasurer ? 'Treasurer Portal' : 'Club Administration'}
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-5">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1">
                {section.title}
              </div>
              {section.items.map((item) => {
                const active = item.exact ? isExactActive(item.href) : isPrefixActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-primary' : item.color}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-border bg-card space-y-1">
          <div className="px-3 py-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span className="truncate font-semibold text-foreground max-w-[130px]">{user.name || user.email}</span>
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary">
              {isTreasurer ? 'Treasurer' : 'Admin'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1 pt-1">
            <Link
              href="/account"
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Member
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              Site
            </Link>
          </div>

          <Link
            href="/api/auth/signout"
            className="flex items-center justify-center gap-1.5 w-full px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
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
            {/* Mobile Hamburger Drawer Trigger */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              className="md:hidden p-2 rounded-xl text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
              aria-label="Toggle admin navigation menu"
            >
              {mobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href={isTreasurer ? "/admin/finance" : "/admin"} className="md:hidden font-bold tracking-tight text-foreground flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-xs">
                {isTreasurer ? 'T' : 'S'}
              </span>
              <span className="text-sm font-extrabold">{isTreasurer ? 'Treasury' : 'Console'}</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {!isTreasurer && (
              <Link
                href="/admin/events/check-in"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition-colors border border-emerald-200"
              >
                <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Check-In</span>
              </Link>
            )}
            <Link
              href="/admin/finance"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/15 text-xs font-semibold transition-colors"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ledger</span>
            </Link>
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border text-xs font-bold text-foreground">
              {(user.name?.[0] || user.email[0]).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-background pb-24 md:pb-8">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* ─── MOBILE BOTTOM BAR ─── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-md z-40 safe-area-bottom">
        <div className="flex justify-around items-center px-1 py-2">
          {isTreasurer ? (
            <>
              <Link 
                href="/admin/finance" 
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
                  isExactActive('/admin/finance') ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Wallet className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-none">Finance</span>
              </Link>

              <Link 
                href="/admin/finance/reports" 
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
                  isPrefixActive('/admin/finance/reports') ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-none">Reports</span>
              </Link>

              <Link 
                href="/admin/expenses" 
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
                  isPrefixActive('/admin/expenses') ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Receipt className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-none">Expenses</span>
              </Link>

              {/* More trigger */}
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
                  mobileDrawerOpen ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-label="Open full admin menu"
              >
                <Menu className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-none">Menu</span>
              </button>
            </>
          ) : (
            <>
              <Link 
                href="/admin" 
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-colors ${
                  isExactActive('/admin') ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-none">Overview</span>
              </Link>

              <Link 
                href="/admin/users" 
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-colors ${
                  isPrefixActive('/admin/users') ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-none">Users</span>
              </Link>

              <Link 
                href="/admin/events" 
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-colors ${
                  isPrefixActive('/admin/events') && !pathname.includes('check-in') ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-none">Events</span>
              </Link>

              <Link 
                href="/admin/finance" 
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-colors ${
                  isPrefixActive('/admin/finance') ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Wallet className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-none">Finance</span>
              </Link>

              {/* More trigger */}
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-colors ${
                  mobileDrawerOpen ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-label="Open full admin menu"
              >
                <Menu className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-none">More</span>
              </button>
            </>
          )}
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
                    S
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm">
                      Admin Console
                    </h3>
                    <p className="text-[11px] text-muted-foreground truncate max-w-[170px]">
                      {user.email}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* All Sections */}
              <div className="space-y-5">
                {navSections.map((section) => (
                  <div key={section.title} className="space-y-1">
                    <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1">
                      {section.title}
                    </div>
                    {section.items.map((item) => {
                      const active = item.exact ? isExactActive(item.href) : isPrefixActive(item.href);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                            active
                              ? 'bg-primary/10 text-primary'
                              : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-primary' : item.color}`} />
                            <span>{item.label}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-border space-y-2 mt-6">
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/account"
                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border"
                >
                  <UserCheck className="w-3.5 h-3.5 text-primary" />
                  <span>Member App</span>
                </Link>

                <Link
                  href="/"
                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border"
                >
                  <Globe className="w-3.5 h-3.5 text-secondary" />
                  <span>Public Site</span>
                </Link>
              </div>

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

