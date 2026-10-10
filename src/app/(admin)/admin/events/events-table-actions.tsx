'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Users, QrCode, Trash2, RefreshCw } from 'lucide-react';
import { deleteEventAdminAction } from '@/server/actions/admin-events';
import { useRouter } from 'next/navigation';

interface EventsTableActionsProps {
  eventId: string;
  eventTitle: string;
  hasTickets?: boolean;
}

export function EventsTableActions({ eventId, eventTitle, hasTickets }: EventsTableActionsProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    const confirmMsg = hasTickets
      ? `"${eventTitle}" has tickets issued.\n\nDeleting will CANCEL the event and issue refunds to attendees.\n\nDo you want to proceed?`
      : `Are you sure you want to delete "${eventTitle}"? This cannot be undone.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setLoading(true);
      const res = await deleteEventAdminAction(eventId);
      alert(res.message);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2.5">
      <Link
        href={`/admin/events/${eventId}/report`}
        className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
        title="Event Report"
      >
        <LayoutDashboard className="w-4 h-4" />
      </Link>
      <Link
        href={`/admin/events/${eventId}/door-staff`}
        className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
        title="Door Staff"
      >
        <Users className="w-4 h-4" />
      </Link>
      <Link
        href={`/admin/events/${eventId}/check-in`}
        className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
        title="Door Check-In"
      >
        <QrCode className="w-4 h-4" />
      </Link>
      <Link
        href={`/admin/events/${eventId}`}
        className="px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors"
      >
        Edit
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        title={hasTickets ? 'Cancel & Refund Event' : 'Delete Event'}
        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      </button>
    </div>
  );
}

