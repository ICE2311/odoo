import { getPublicEvents } from '@/server/data/public/events';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function EventsPage() {
  const events = await getPublicEvents();

  return (
    <div className="max-w-screen-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Upcoming Events</h1>
      <div className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className="border p-4 rounded shadow-sm">
            {event.bannerUrl && (
              <img src={event.bannerUrl} alt={event.title} className="w-full h-48 object-cover mb-4" />
            )}
            <h2 className="text-xl font-semibold">{event.title}</h2>
            <p className="text-gray-600">{format(event.startsAt, 'PPp')} - {event.venue}</p>
            <Link href={\`/events/\${event.slug}\`} className="mt-2 inline-block text-blue-600 hover:underline">
              View Details
            </Link>
          </div>
        ))}
        {events.length === 0 && <p>No upcoming events.</p>}
      </div>
    </div>
  );
}

