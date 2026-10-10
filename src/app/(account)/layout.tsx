import Link from 'next/link';
import { getCaller } from '@/server/auth/guards';
import { Home, Ticket, ShoppingBag, ShoppingCart, User, CreditCard, LayoutDashboard, LogOut } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const caller = await getCaller();
  const session = caller.kind === "user" ? { user: caller.user } : null;
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 w-full border-b bg-blue-600 text-white">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl tracking-tight flex items-center gap-2">
            <Home className="w-5 h-5" />
            Skyline
          </Link>
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link href="/cart" className="flex items-center gap-2 hover:bg-blue-700 px-3 py-1.5 rounded-md transition-colors">
              <ShoppingCart className="w-4 h-4" />
              Cart
            </Link>
            <div className="hidden sm:block">|</div>
            <span className="hidden sm:block">{session.user.email}</span>
            <Link href="/api/auth/signout" className="flex items-center gap-2 hover:bg-blue-700 px-3 py-1.5 rounded-md transition-colors text-blue-100">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0 hide-scrollbar">
            <Link href="/account" className="flex items-center gap-3 px-4 py-2.5 rounded-md font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors whitespace-nowrap">
              <LayoutDashboard className="w-5 h-5 text-gray-400" />
              Dashboard
            </Link>
            <Link href="/account/membership" className="flex items-center gap-3 px-4 py-2.5 rounded-md font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors whitespace-nowrap">
              <CreditCard className="w-5 h-5 text-gray-400" />
              Membership
            </Link>
            <Link href="/account/tickets" className="flex items-center gap-3 px-4 py-2.5 rounded-md font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors whitespace-nowrap">
              <Ticket className="w-5 h-5 text-gray-400" />
              My Tickets
            </Link>
            <Link href="/account/orders" className="flex items-center gap-3 px-4 py-2.5 rounded-md font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors whitespace-nowrap">
              <ShoppingBag className="w-5 h-5 text-gray-400" />
              Merch Orders
            </Link>
            <Link href="/account/profile" className="flex items-center gap-3 px-4 py-2.5 rounded-md font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors whitespace-nowrap">
              <User className="w-5 h-5 text-gray-400" />
              Profile
            </Link>
          </nav>
        </aside>

        <main className="flex-1 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
}
