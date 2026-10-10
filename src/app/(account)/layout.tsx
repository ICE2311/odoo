import Link from 'next/link';
import { getCaller } from '@/server/auth/guards';
import { Home, LayoutDashboard, ShoppingBag, Ticket, User, LogOut, Menu } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const caller = await getCaller();
  const session = caller.kind === 'user' ? { user: caller.user } : null;

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-semibold text-foreground">Skyline</span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {session.user.email}
            </span>
            <Link
              href="/api/auth/signout"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-card/50 hidden md:block">
          <nav className="p-6 space-y-2">
            <Link
              href="/account"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </Link>
            <Link
              href="/account/membership"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Ticket className="w-5 h-5" />
              Membership
            </Link>
            <Link
              href="/account/tickets"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Ticket className="w-5 h-5" />
              My Tickets
            </Link>
            <Link
              href="/account/orders"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              Merch Orders
            </Link>
            <Link
              href="/account/profile"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <User className="w-5 h-5" />
              Profile
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-8 md:py-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
