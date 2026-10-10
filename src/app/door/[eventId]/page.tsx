import { Suspense } from 'react';
import { requireDoorAccess } from '@/server/auth/guards';
import { DoorCheckInView } from '@/components/door/door-check-in-view';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Props {
  params: Promise<{ eventId: string }>;
}

export default async function DoorStaffCheckInPage({ params }: Props) {
  const { eventId } = await params;
  await requireDoorAccess(eventId);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8">
      <div className="max-w-4xl mx-auto mb-4">
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="text-muted-foreground font-medium">Loading door scanner...</p>
          </div>
        }
      >
        <DoorCheckInView initialEventId={eventId} lockToEvent={false} />
      </Suspense>
    </div>
  );
}

