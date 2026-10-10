import { getMyTickets } from '@/server/data/me/tickets';
import Link from 'next/link';

export default async function MyTicketsPage() {
  const tickets = await getMyTickets();

  return (
    <div className="max-w-screen-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Tickets</h1>
      <div className="space-y-4">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="border p-4 rounded shadow-sm flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">{ticket.event.title}</h2>
              <p className="text-sm text-gray-600">{ticket.holderName} - {ticket.priceType}</p>
              <p className="text-sm">Status: <span className="font-medium">{ticket.status}</span></p>
            </div>
            <Link href={\`/account/tickets/\${ticket.id}\`} className="bg-blue-600 text-white px-3 py-1 rounded">
              View QR
            </Link>
          </div>
        ))}
        {tickets.length === 0 && <p>You have no tickets.</p>}
      </div>
    </div>
  );
}

