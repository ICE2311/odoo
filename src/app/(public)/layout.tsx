import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { getCaller } from '@/server/auth/guards'; // assuming next-auth is here, or we can just fetch session

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const caller = await getCaller();
  const session = caller.kind === "user" ? { user: caller.user } : null;

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-bold text-xl tracking-tight text-blue-600">
              Skyline
            </Link>
            <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
              <Link href="/events" className="hover:text-blue-600 transition-colors">Events</Link>
              <Link href="/shop" className="hover:text-blue-600 transition-colors">Shop</Link>
              <Link href="/announcements" className="hover:text-blue-600 transition-colors">Announcements</Link>
              <Link href="/volunteer" className="hover:text-blue-600 transition-colors">Volunteer</Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            {session ? (
              <Link href="/account" className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">Dashboard</Link>
            ) : (
              <Link href="/login" className="text-sm font-medium hover:text-blue-600 transition-colors">Sign In</Link>
            )}
            
            <button className="md:hidden p-2 text-gray-600">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="border-t bg-white py-12 mt-auto">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Skyline Student Association. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="/" className="hover:text-gray-900">Terms</Link>
            <Link href="/" className="hover:text-gray-900">Privacy</Link>
            <Link href="/admin" className="hover:text-gray-900">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
