import { getAdminEvents } from '@/server/data/admin/events';
import Link from 'next/link';

export default async function AdminEventsPage() {
  const events = await getAdminEvents();

  return (
    <div className="max-w-screen-lg mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Manage Events</h1>
        <Link href="/admin/events/new" className="bg-blue-600 text-white px-4 py-2 rounded">
          New Event
        </Link>
      </div>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b">
            <th className="p-2">Title</th>
            <th className="p-2">Status</th>
            <th className="p-2">Sold/Cap</th>
            <th className="p-2">Net Revenue</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map(event => (
            <tr key={event.id} className="border-b">
              <td className="p-2">{event.title}</td>
              <td className="p-2">{event.status}</td>
              <td className="p-2">{event.seatsSold} / {event.capacity}</td>
              <td className="p-2">₹{(event.grossRevenue - event.refunds) / 100}</td>
              <td className="p-2 space-x-2">
                <Link href={\`/admin/events/\${event.id}\`} className="text-blue-600">Edit</Link>
                <Link href={\`/admin/events/\${event.id}/report\`} className="text-blue-600">Report</Link>
                <Link href={\`/admin/events/\${event.id}/door-staff\`} className="text-blue-600">Staff</Link>
                <Link href={\`/admin/events/\${event.id}/check-in\`} className="text-blue-600">Check-in</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

