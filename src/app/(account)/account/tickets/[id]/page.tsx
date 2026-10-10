import { getMyTicket } from '@/server/data/me/tickets';
import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { Calendar, MapPin, User } from 'lucide-react';
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
      <Link href="/account/tickets" className="text-primary font-medium hover:underline text-sm mb-4 inline-block">
        ← Back to all tickets
      </Link>
      
      <div className="bg-card border border-border rounded-[var(--radius-xl)] shadow-sm overflow-hidden flex flex-col items-center">
        {/* Ticket Header */}
        <div className="w-full gradient-primary text-primary-foreground p-6 text-center space-y-2 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-background rounded-full"></div>
          <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-background rounded-full"></div>
          
          <h1 className="text-xl font-bold tracking-tight px-4 leading-tight">{(ticket.event as any).title}</h1>
          <p className="text-primary-foreground/80 text-sm uppercase tracking-widest font-semibold">{ticket.priceType} Ticket</p>
        </div>

        {/* QR Code Section */}
        <div className="p-8 pb-4 flex flex-col items-center border-b border-border w-full border-dashed">
          <div className="bg-white p-2 rounded-[var(--radius-xl)] shadow-sm border border-border mb-4">
            <img src={qrDataUrl} alt="Ticket QR Code" className="w-48 h-48" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono">{ticket.code}</p>
            <p className={`text-sm font-bold uppercase tracking-wider ${
              ticket.status === 'valid' ? 'text-success' : 'text-destructive'
            }`}>
              {ticket.status}
            </p>
          </div>
        </div>

        {/* Ticket Details */}
        <div className="p-6 w-full space-y-4 bg-muted/30">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Date & Time</p>
              <p className="font-semibold text-foreground">{new Date((ticket.event as any).startsAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Venue</p>
              <p className="font-semibold text-foreground">{(ticket.event as any).venue}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Ticket Holder</p>
              <p className="font-semibold text-foreground">{ticket.holderName}</p>
            </div>
          </div>
          
          {ticket.checkedInAt && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="bg-success/10 text-success p-3 rounded-[var(--radius-md)] flex items-center justify-center gap-2 font-semibold text-sm">
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
