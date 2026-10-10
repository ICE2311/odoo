import Link from 'next/link';
import { getCaller } from '@/server/auth/guards';
import { Sparkles } from 'lucide-react';
import { PublicHeader } from '@/components/public-header';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const caller = await getCaller();
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PublicHeader caller={caller} />
      
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
