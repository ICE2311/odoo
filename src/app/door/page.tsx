import { Suspense } from 'react';
import { requireUser } from '@/server/auth/guards';
import { DoorCheckInView } from '@/components/door/door-check-in-view';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function GeneralDoorPage() {
  const caller = await requireUser();
  if (!caller.isAdmin && !caller.isMember) {
    redirect('/account');
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8">
      <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between">
        <Link
          href="/account"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          Door Staff & Member Check-In
        </span>
      </div>

      <Suspense
        fallback={
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="text-muted-foreground font-medium">Loading door scanner...</p>
          </div>
        }
      >
        <DoorCheckInView />
      </Suspense>
    </div>
  );
}

