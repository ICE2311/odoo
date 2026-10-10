import { getPublicEventBySlug } from '@/server/data/public/events';
import { notFound } from 'next/navigation';
import { getCaller } from '@/server/auth/guards';
import Link from 'next/link';

export default async function EventDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const event = await getPublicEventBySlug((await params).slug);
  if (!event) return notFound();

  const caller = await getCaller();
  const availableSeats = event.capacity - event.seatsSold - event.seatsHeld;
  const isAvailable = availableSeats > 0;

  return (
    <div className="max-w-screen-md mx-auto p-4">
      {event.bannerUrl && (
        <img src={event.bannerUrl} alt={event.title} className="w-full h-64 object-cover mb-4 rounded" />
      )}
      <h1 className="text-3xl font-bold">{event.title}</h1>
      <p className="text-gray-600 mb-4">{event.venue} | {event.startsAt.toLocaleString()}</p>
      
      <div className="prose mb-6">
        {event.description}
      </div>

      <div className="border p-4 rounded bg-gray-50">
        <h3 className="font-semibold text-lg">Tickets</h3>
        <p>Member Price: ₹{event.memberPricePaise / 100}</p>
        <p>Non-Member Price: ₹{event.nonMemberPricePaise / 100}</p>
        <p className="mt-2">{availableSeats} seats left</p>
        
        {caller.kind === 'visitor' ? (
          <div className="mt-4">
            <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded">
              Login to Buy
            </Link>
          </div>
        ) : (
          <form action="/api/checkout/ticket" method="POST" className="mt-4 flex flex-col gap-2 w-48">
            <input type="hidden" name="eventId" value={event.id} />
            <label>Qty:</label>
            <input type="number" name="qty" min="1" max={event.maxTicketsPerUser} defaultValue={1} className="border p-1" />
            <button type="submit" disabled={!isAvailable} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">
              {isAvailable ? 'Buy Ticket' : 'Sold Out'}
            </button>
          </form>
        )}
        {caller.kind !== 'visitor' && !caller.isMember && (
          <p className="mt-2 text-sm text-gray-500">Members pay ₹{event.memberPricePaise / 100} — <Link href="/account/membership" className="underline">Join</Link></p>
        )}
      </div>
    </div>
  );
}

