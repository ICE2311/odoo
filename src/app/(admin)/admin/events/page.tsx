import { getAdminEvents } from '@/server/data/admin/events';
import Link from 'next/link';
import { Calendar, Plus, Users, LayoutDashboard, QrCode } from 'lucide-react';
import { EventsTableActions } from './events-table-actions';

export default async function AdminEventsPage() {
  const events = await getAdminEvents();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Events Management</h1>
          <p className="text-muted-foreground text-sm">Create and manage upcoming events and track ticket sales.</p>
        </div>
        <Link href="/admin/events/new" className="bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-semibold shadow-xs">
          <Plus className="w-4 h-4" /> New Event
        </Link>
      </div>

      <div className="bg-card border rounded-[var(--radius-xl)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted border-b">
              <tr>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Event</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground text-right">Sold / Cap</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground text-right">Net Revenue</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events.map((event: any) => (
                <tr key={event.id} className="hover:bg-muted/80 even:bg-muted/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-card-foreground">{event.title}</span>
                      {event.membersOnly && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          ★ Members Only
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {new Date(event.startsAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-[var(--radius-md)] text-xs font-medium uppercase tracking-wider ${
                      event.status === 'published' ? 'bg-success/10 text-success' : 'bg-muted text-foreground'
                    }`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{event.seatsSold}</span>
                      <span className="text-muted-foreground">/ {event.capacity || '∞'}</span>
                    </div>
                    {event.capacity && (
                      <div className="w-full bg-muted h-1.5 rounded-full mt-1.5 overflow-hidden flex justify-end">
                        <div className="bg-primary h-full" style={{ width: `${Math.min((event.seatsSold / event.capacity) * 100, 100)}%` }}></div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-success">
                    ₹{((event.grossRevenue - event.refunds) / 100).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <EventsTableActions
                      eventId={event.id}
                      eventTitle={event.title}
                      hasTickets={event.seatsSold > 0}
                    />
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No events found. Click "New Event" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
