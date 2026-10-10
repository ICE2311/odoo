import { getMyTicket } from '@/server/data/me/tickets';
import { notFound } from 'next/navigation';

export default async function TicketDetailsPage({ params }: { params: { id: string } }) {
  let ticket;
  try {
    ticket = await getMyTicket(params.id);
  } catch {
    return notFound();
  }

  return (
    <div className="max-w-screen-sm mx-auto p-4 text-center">
      <h1 className="text-2xl font-bold mb-2">{ticket.event.title}</h1>
      <p className="mb-4">{ticket.event.venue} | {ticket.event.startsAt.toLocaleString()}</p>
      
      <div className="border-4 border-gray-800 inline-block p-4 rounded-lg bg-white mb-6">
        {/* Placeholder for actual QR code rendering */}
        <div className="w-48 h-48 bg-gray-200 flex items-center justify-center font-mono text-xs break-all p-2">
          {ticket.qrToken}
        </div>
      </div>

      <div className="text-left bg-gray-50 p-4 rounded">
        <p><strong>Holder:</strong> {ticket.holderName}</p>
        <p><strong>Type:</strong> {ticket.priceType}</p>
        <p><strong>Status:</strong> {ticket.status}</p>
        {ticket.checkedInAt && (
          <p className="text-green-600 mt-2 font-semibold">Checked In at {ticket.checkedInAt.toLocaleString()}</p>
        )}
      </div>
    </div>
  );
}

