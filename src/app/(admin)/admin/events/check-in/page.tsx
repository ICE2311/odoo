'use client';

import { Suspense } from 'react';
import { DoorCheckInView } from '@/components/door/door-check-in-view';
import { RefreshCw } from 'lucide-react';

export default function AdminEventCheckInPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground font-medium">Loading check-in system...</p>
        </div>
      }
    >
      <DoorCheckInView />
    </Suspense>
  );
}
