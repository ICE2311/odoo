import { getCaller } from '@/server/auth/guards';
import Link from 'next/link';
import { CreditCard, Ticket, ShoppingBag, ArrowRight, User } from 'lucide-react';

export default async function AccountPage() {
  const caller = await getCaller();
  if (caller.kind !== 'user') return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back, {caller.user.name?.split(' ')[0] || 'Member'}!</h1>
        <p className="text-gray-500 mt-1">Manage your Skyline membership, tickets, and orders from here.</p>
      </div>

      {/* Membership Status Card */}
      <div className={`p-6 rounded-2xl border ${caller.isMember ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${caller.isMember ? 'bg-blue-600' : 'bg-gray-400'}`}></div>
              <h2 className="font-semibold text-lg">{caller.isMember ? 'Active Member' : 'Not a Member'}</h2>
            </div>
            <p className={`text-sm ${caller.isMember ? 'text-blue-800' : 'text-gray-600'}`}>
              {caller.isMember 
                ? 'Your membership is active. Enjoy exclusive event pricing and merch access.' 
                : 'Join Skyline Student Association to unlock member pricing and buy exclusive merch.'}
            </p>
          </div>
          <Link 
            href="/account/membership" 
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
              caller.isMember ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {caller.isMember ? 'View Card' : 'Get Membership'}
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Link href="/account/tickets" className="group p-6 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Ticket className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-lg mb-1">My Tickets</h3>
          <p className="text-sm text-gray-500 mb-4">View your upcoming event tickets and QR codes.</p>
          <div className="text-sm font-medium text-indigo-600 flex items-center gap-1">
            View tickets <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
        
        <Link href="/account/orders" className="group p-6 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Merch Orders</h3>
          <p className="text-sm text-gray-500 mb-4">Track your merchandise orders and pickup status.</p>
          <div className="text-sm font-medium text-emerald-600 flex items-center gap-1">
            View orders <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>
    </div>
  );
}
