import Link from 'next/link';
import { getCaller } from '@/server/auth/guards';
import { Menu, User, Sparkles, ShoppingBag } from 'lucide-react';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const caller = await getCaller();
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight hover:opacity-90 transition-opacity">
            <Sparkles className="w-5 h-5" />
            Skyline
          </Link>
          
          <div className="hidden md:flex gap-8 items-center text-sm font-medium text-foreground">
            <Link href="/events" className="hover:text-primary transition-colors">Events</Link>
            <Link href="/shop" className="hover:text-primary transition-colors">Shop</Link>
            <Link href="/announcements" className="hover:text-primary transition-colors">Announcements</Link>
          </div>

          <div className="flex items-center gap-3">
            {caller.kind === 'user' ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/cart"
                  className="p-2 rounded-full text-foreground/80 hover:text-primary hover:bg-muted transition-colors flex items-center gap-1.5 text-xs font-semibold"
                  title="Shopping Cart"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span className="hidden sm:inline">Cart</span>
                </Link>

                <Link
                  href="/account/orders"
                  className="hidden md:inline-flex px-3 py-1.5 text-xs font-semibold text-foreground/80 hover:text-primary hover:bg-muted rounded-full transition-colors"
                >
                  My Orders
                </Link>

                <Link href="/account" className="flex items-center gap-2 bg-muted px-3.5 py-1.5 rounded-full hover:bg-muted/80 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    {caller.user.name?.[0] || 'U'}
                  </div>
                  <span className="text-sm font-medium">Account</span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="hidden md:inline-block px-4 py-2 text-sm font-medium hover:text-primary transition-colors">Sign In</Link>
                <Link href="/register" className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm">Join Now</Link>
              </div>
            )}
            <button className="md:hidden p-2 text-foreground">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>
      
      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-white border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-primary font-bold text-xl">
            <Sparkles className="w-5 h-5" />
            Skyline
          </div>
          <div className="text-sm text-muted-foreground">
            Empowering student life. 
          </div>
          <div className="flex gap-4 text-sm font-medium text-foreground">
            <Link href="/events" className="hover:text-primary">Events</Link>
            <Link href="/shop" className="hover:text-primary">Shop</Link>
          </div>
          <div className="text-sm text-muted-foreground">
            © 2026 Skyline Student Association
          </div>
        </div>
      </footer>
    </div>
  );
}
