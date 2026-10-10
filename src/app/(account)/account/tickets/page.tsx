import { getMyTickets } from '@/server/data/me/tickets';
import Link from 'next/link';
import { Ticket, Calendar, MapPin, QrCode } from 'lucide-react';

export default async function MyTicketsPage() {
  const tickets = await getMyTickets();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight">My Tickets</h1>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed">
          <Ticket className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900">No tickets found</h3>
          <p className="text-gray-500 mb-4">You haven't purchased any tickets yet.</p>
          <Link href="/events" className="text-blue-600 font-medium hover:underline">Browse Events</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {tickets.map((ticket: any) => (
            <div key={ticket.id} className="border rounded-xl overflow-hidden bg-white shadow-sm flex flex-col">
              <div className="bg-gray-50 px-5 py-4 border-b flex justify-between items-center">
                <h2 className="font-bold text-lg truncate pr-4">{ticket.event.title}</h2>
                <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider shrink-0 ${
                  ticket.status === 'valid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {ticket.status}
                </span>
              </div>
              <div className="p-5 flex-1 space-y-4">
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>{new Date(ticket.event.startsAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate">{ticket.event.venue}</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t flex justify-between items-center text-sm">
                  <div>
                    <span className="block text-xs text-gray-500 uppercase tracking-wide">Admit 1</span>
                    <span className="font-medium">{ticket.holderName}</span>
                  </div>
                  <Link href={`/account/tickets/${ticket.id}`} className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                    <QrCode className="w-4 h-4" /> View Ticket
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
