import { getAdminEvents } from '@/server/data/admin/events';
import Link from 'next/link';
import { Calendar, Plus, Users, LayoutDashboard, QrCode } from 'lucide-react';

export default async function AdminEventsPage() {
  const events = await getAdminEvents();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Events Management</h1>
          <p className="text-gray-500 text-sm">Create and manage upcoming events and track ticket sales.</p>
        </div>
        <Link href="/admin/events/new" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm">
          <Plus className="w-4 h-4" /> New Event
        </Link>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold text-gray-600">Event</th>
                <th className="px-6 py-3 font-semibold text-gray-600">Status</th>
                <th className="px-6 py-3 font-semibold text-gray-600 text-right">Sold / Cap</th>
                <th className="px-6 py-3 font-semibold text-gray-600 text-right">Net Revenue</th>
                <th className="px-6 py-3 font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.map((event: any) => (
                <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{event.title}</div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {new Date(event.startsAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider ${
                      event.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{event.seatsSold}</span>
                      <span className="text-gray-400">/ {event.capacity || '∞'}</span>
                    </div>
                    {event.capacity && (
                      <div className="w-full bg-gray-200 h-1.5 rounded-full mt-1.5 overflow-hidden flex justify-end">
                        <div className="bg-blue-500 h-full" style={{ width: `${Math.min((event.seatsSold / event.capacity) * 100, 100)}%` }}></div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-green-600">
                    ₹{((event.grossRevenue - event.refunds) / 100).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <Link href={`/admin/events/${event.id}/report`} className="text-gray-500 hover:text-blue-600 transition-colors" title="Report">
                      <LayoutDashboard className="w-4 h-4 inline" />
                    </Link>
                    <Link href={`/admin/events/${event.id}/door-staff`} className="text-gray-500 hover:text-blue-600 transition-colors" title="Door Staff">
                      <Users className="w-4 h-4 inline" />
                    </Link>
                    <Link href={`/admin/events/${event.id}/check-in`} className="text-gray-500 hover:text-blue-600 transition-colors" title="Check In">
                      <QrCode className="w-4 h-4 inline" />
                    </Link>
                    <Link href={`/admin/events/${event.id}`} className="text-blue-600 font-medium hover:underline text-sm ml-2">Edit</Link>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
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
