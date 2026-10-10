import Link from 'next/link';
import { LayoutDashboard, Users, Calendar, ShoppingBag, ShoppingCart, HeartHandshake, FileText, Banknote, Settings, Activity, ShieldAlert, ArrowLeft } from 'lucide-react';
import { requireAdmin } from '@/server/auth/guards';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <aside className="w-64 bg-gray-900 text-gray-300 flex flex-col h-full shrink-0">
        <div className="h-16 flex items-center px-6 bg-gray-950 text-white font-bold tracking-tight">
          Skyline Admin
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 hover:text-white transition-colors">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 hover:text-white transition-colors">
            <Users className="w-5 h-5" /> Users & Members
          </Link>
          <Link href="/admin/events" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 hover:text-white transition-colors">
            <Calendar className="w-5 h-5" /> Events
          </Link>
          <Link href="/admin/shop" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 hover:text-white transition-colors">
            <ShoppingBag className="w-5 h-5" /> Merch Shop
          </Link>
          <Link href="/admin/orders" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 hover:text-white transition-colors">
            <ShoppingCart className="w-5 h-5" /> Orders
          </Link>
          <Link href="/admin/fundraisers" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 hover:text-white transition-colors">
            <HeartHandshake className="w-5 h-5" /> Fundraisers
          </Link>
          <Link href="/admin/expenses" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 hover:text-white transition-colors">
            <FileText className="w-5 h-5" /> Expenses
          </Link>
          <Link href="/admin/finance" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 hover:text-white transition-colors">
            <Banknote className="w-5 h-5" /> Finance
          </Link>
          
          <div className="pt-4 mt-4 border-t border-gray-800">
            <Link href="/admin/announcements" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 hover:text-white transition-colors">
              <Activity className="w-5 h-5" /> Announcements
            </Link>
            <Link href="/admin/audit-log" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 hover:text-white transition-colors">
              <ShieldAlert className="w-5 h-5" /> Audit Log
            </Link>
            <Link href="/admin/settings" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 hover:text-white transition-colors">
              <Settings className="w-5 h-5" /> Settings
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <Link href="/" className="flex items-center justify-center gap-2 w-full py-2 bg-gray-800 hover:bg-gray-700 rounded-md text-sm transition-colors text-white">
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-gray-50 flex flex-col">
        <header className="h-16 bg-white border-b flex items-center px-8 shadow-sm">
          <div className="text-xl font-semibold text-gray-800">Workspace</div>
        </header>
        <div className="p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
