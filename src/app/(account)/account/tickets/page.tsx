import { getMyTickets } from '@/server/data/me/tickets';
import Link from 'next/link';
import { Ticket, Calendar, MapPin, QrCode } from 'lucide-react';

export default async function MyTicketsPage() {
  const tickets = await getMyTickets();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b border-border pb-4">
        <h1 className="text-3xl font-bold tracking-tight">My Tickets</h1>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-[var(--radius-xl)] border border-border shadow-sm">
          <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground">No tickets found</h3>
          <p className="text-muted-foreground mb-6">You haven't purchased any tickets yet.</p>
          <Link href="/events" className="inline-block px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-[var(--radius-md)] hover:opacity-90 transition-opacity">
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {tickets.map((ticket: any) => (
            <div key={ticket.id} className="border border-border rounded-[var(--radius-xl)] bg-card shadow-sm flex flex-col hover:border-primary/30 transition-all card-hover">
              <div className="bg-muted/30 px-6 py-4 border-b border-border flex justify-between items-center">
                <h2 className="font-bold text-lg text-foreground truncate pr-4">{ticket.event.title}</h2>
                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shrink-0 ${
                  ticket.status === 'valid' ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
                }`}>
                  {ticket.status}
                </span>
              </div>
              <div className="p-6 flex-1 space-y-4">
                <div className="space-y-2 text-sm text-muted-foreground font-medium">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                    <span>{new Date(ticket.event.startsAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-secondary shrink-0" />
                    <span className="truncate">{ticket.event.venue}</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border mt-auto flex justify-between items-center text-sm">
                  <div>
                    <span className="block text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Admit 1</span>
                    <span className="font-semibold text-foreground">{ticket.holderName}</span>
                  </div>
                  <Link href={`/account/tickets/${ticket.id}`} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-[var(--radius-md)] hover:opacity-90 font-medium transition-opacity shadow-sm">
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
