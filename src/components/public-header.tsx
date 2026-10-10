'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Sparkles, Menu, X, Calendar, ShoppingBag, 
  Megaphone, ShoppingCart, User, Shield, 
  Package, Ticket, LogOut, ArrowRight 
} from 'lucide-react';

interface PublicHeaderProps {
  caller: {
    kind: 'visitor';
  } | {
    kind: 'user';
    user: {
      id: string;
      name: string | null;
      email: string;
      role: string;
    };
    isAdmin: boolean;
    isMember: boolean;
  };
}

export function PublicHeader({ caller }: PublicHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border shadow-xs">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link 
          href="/" 
          className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight hover:opacity-90 transition-opacity"
        >
          <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-extrabold tracking-tight text-foreground">Skyline</span>
        </Link>
        
        {/* Desktop Nav Links */}
        <nav className="hidden md:flex gap-8 items-center text-sm font-semibold text-muted-foreground">
          <Link 
            href="/events" 
            className={`transition-colors hover:text-foreground ${isActive('/events') ? 'text-primary font-bold' : ''}`}
          >
            Events
          </Link>
          <Link 
            href="/shop" 
            className={`transition-colors hover:text-foreground ${isActive('/shop') ? 'text-primary font-bold' : ''}`}
          >
            Shop
          </Link>
          <Link 
            href="/announcements" 
            className={`transition-colors hover:text-foreground ${isActive('/announcements') ? 'text-primary font-bold' : ''}`}
          >
            Announcements
          </Link>
        </nav>

        {/* Desktop Right Actions */}
        <div className="hidden md:flex items-center gap-3">
          {caller.kind === 'user' ? (
            <div className="flex items-center gap-2">
              <Link
                href="/cart"
                className="p-2 rounded-xl text-foreground/80 hover:text-primary hover:bg-muted transition-colors flex items-center gap-1.5 text-xs font-semibold"
                title="Shopping Cart"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Cart</span>
              </Link>

              <Link
                href="/account/orders"
                className="px-3 py-1.5 text-xs font-semibold text-foreground/80 hover:text-primary hover:bg-muted rounded-xl transition-colors"
              >
                My Orders
              </Link>

              {caller.isAdmin && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </Link>
              )}

              <Link 
                href="/account" 
                className="flex items-center gap-2 bg-muted px-3.5 py-1.5 rounded-xl hover:bg-muted/80 transition-colors border border-border/50"
              >
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  {caller.user.name?.[0] || caller.user.email[0].toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-foreground truncate max-w-[120px]">
                  {caller.user.name?.split(' ')[0] || 'Account'}
                </span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link 
                href="/login" 
                className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/register" 
                className="bg-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-sm"
              >
                Join Now
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Header Buttons */}
        <div className="flex items-center gap-2 md:hidden">
          {caller.kind === 'user' ? (
            <>
              <Link
                href="/cart"
                className="p-2 rounded-xl text-foreground/80 hover:text-primary hover:bg-muted transition-colors relative"
                aria-label="Shopping Cart"
              >
                <ShoppingCart className="w-5 h-5" />
              </Link>
              <Link 
                href="/account" 
                className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-xs"
                aria-label="My Account"
              >
                {caller.user.name?.[0] || caller.user.email[0].toUpperCase()}
              </Link>
            </>
          ) : (
            <Link 
              href="/register" 
              className="bg-primary text-primary-foreground px-3.5 py-1.5 rounded-xl text-xs font-bold hover:opacity-90 shadow-xs"
            >
              Join
            </Link>
          )}

          {/* Hamburger button */}
          <button 
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-xl text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
            aria-label="Toggle navigation menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Backdrop & Drawer */}
      {isOpen && (
        <div 
          className="fixed inset-0 top-16 bg-black/50 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-card border-b border-border shadow-2xl p-4 sm:p-6 space-y-5 max-h-[calc(100vh-4rem)] overflow-y-auto animate-in slide-in-from-top-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Primary Site Navigation */}
            <div className="space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1">
                Explore
              </div>
              <Link 
                href="/events" 
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive('/events') 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                }`}
              >
                <Calendar className="w-5 h-5 text-indigo-500 shrink-0" />
                <span>Events & Tickets</span>
              </Link>
              <Link 
                href="/shop" 
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive('/shop') 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                }`}
              >
                <ShoppingBag className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Merch Shop</span>
              </Link>
              <Link 
                href="/announcements" 
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive('/announcements') 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                }`}
              >
                <Megaphone className="w-5 h-5 text-amber-500 shrink-0" />
                <span>Announcements</span>
              </Link>
            </div>

            {/* Authenticated Member Section */}
            {caller.kind === 'user' ? (
              <div className="space-y-1 pt-3 border-t border-border">
                <div className="px-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1">
                  <span>Student Portal</span>
                  <span className="text-[10px] font-medium normal-case text-primary">
                    {caller.user.email}
                  </span>
                </div>

                <Link 
                  href="/account" 
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    pathname === '/account' 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-primary shrink-0" />
                    <span>My Account Overview</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </Link>

                <Link 
                  href="/account/membership" 
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Ticket className="w-5 h-5 text-violet-500 shrink-0" />
                  <span>Digital Member Pass</span>
                </Link>

                <Link 
                  href="/cart" 
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
                >
                  <ShoppingCart className="w-5 h-5 text-sky-500 shrink-0" />
                  <span>Merch Cart</span>
                </Link>

                <Link 
                  href="/account/orders" 
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Package className="w-5 h-5 text-amber-500 shrink-0" />
                  <span>My Orders</span>
                </Link>

                {caller.isAdmin && (
                  <Link 
                    href="/admin" 
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                  >
                    <Shield className="w-5 h-5 text-primary shrink-0" />
                    <span>Admin Console</span>
                  </Link>
                )}

                <div className="pt-2">
                  <Link 
                    href="/api/auth/signout" 
                    className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>Sign Out</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="pt-3 border-t border-border space-y-2">
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1">
                  Account Access
                </div>
                <Link 
                  href="/login" 
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold border border-border text-foreground hover:bg-muted transition-colors"
                >
                  <span>Sign In with Email</span>
                </Link>
                <Link 
                  href="/register" 
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-sm"
                >
                  <span>Join Skyline SSA</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

