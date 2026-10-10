import { getPublicEvents } from '@/server/data/public/events';
import Link from 'next/link';
import { Calendar as CalendarIcon, MapPin } from 'lucide-react';

export default async function EventsPage() {
  const events = await getPublicEvents();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upcoming Events</h1>
          <p className="text-gray-500 mt-1">Join us for galas, workshops, and meetups.</p>
        </div>
      </div>
      
      {events.length === 0 ? (
        <div className="text-center py-24 bg-gray-50 rounded-2xl border-2 border-dashed">
          <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900">No events found</h3>
          <p className="text-gray-500">Check back later for new events.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Link key={event.id} href={`/events/${event.slug}`} className="group border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all flex flex-col">
              <div className="aspect-[16/9] w-full bg-gray-100 overflow-hidden relative">
                {event.bannerUrl ? (
                  <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <CalendarIcon className="w-12 h-12" />
                  </div>
                )}
                {event.capacity && (
                  <div className="absolute top-2 right-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded">
                    Limited Capacity
                  </div>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h2 className="text-xl font-bold group-hover:text-blue-600 transition-colors line-clamp-1">{event.title}</h2>
                <div className="mt-3 space-y-1.5 text-sm text-gray-600 flex-1">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="truncate">{event.startsAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="truncate">{event.venue}</span>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t flex justify-between items-center text-sm font-medium">
                  <span className="text-blue-600">View Details & Tickets</span>
                  <span className="text-gray-400 group-hover:text-blue-600 transition-colors">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
