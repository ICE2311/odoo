import { getMyTicket } from '@/server/data/me/tickets';
import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { Calendar, MapPin, User, Tag } from 'lucide-react';
import Link from 'next/link';

export default async function TicketDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  let ticket;
  try {
    ticket = await getMyTicket((await params).id);
  } catch {
    return notFound();
  }

  const qrDataUrl = await QRCode.toDataURL(ticket.qrToken, { width: 300, margin: 2 });

  return (
    <div className="max-w-md mx-auto space-y-6 pt-4">
      <Link href="/account/tickets" className="text-blue-600 font-medium hover:underline text-sm mb-4 inline-block">
        ← Back to all tickets
      </Link>
      
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden flex flex-col items-center">
        {/* Ticket Header */}
        <div className="w-full bg-blue-600 text-white p-6 text-center space-y-2 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-50 rounded-full"></div>
          <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-50 rounded-full"></div>
          
          <h1 className="text-xl font-bold tracking-tight px-4 leading-tight">{(ticket.event as any).title}</h1>
          <p className="text-blue-100 text-sm opacity-90 uppercase tracking-widest font-semibold">{ticket.priceType} Ticket</p>
        </div>

        {/* QR Code Section */}
        <div className="p-8 pb-4 flex flex-col items-center border-b w-full border-dashed">
          <div className="bg-white p-2 rounded-xl shadow-sm border mb-4">
            <img src={qrDataUrl} alt="Ticket QR Code" className="w-48 h-48" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-mono">{ticket.code}</p>
            <p className={`text-sm font-bold uppercase tracking-wider ${
              ticket.status === 'valid' ? 'text-green-600' : 'text-red-600'
            }`}>
              {ticket.status}
            </p>
          </div>
        </div>

        {/* Ticket Details */}
        <div className="p-6 w-full space-y-4 bg-gray-50">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Date & Time</p>
              <p className="font-medium text-gray-900">{new Date((ticket.event as any).startsAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Venue</p>
              <p className="font-medium text-gray-900">{(ticket.event as any).venue}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Ticket Holder</p>
              <p className="font-medium text-gray-900">{ticket.holderName}</p>
            </div>
          </div>
          
          {ticket.checkedInAt && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="bg-green-100 text-green-800 p-3 rounded-lg flex items-center justify-center gap-2 font-medium text-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Checked In at {new Date(ticket.checkedInAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', timeStyle: 'short' })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
