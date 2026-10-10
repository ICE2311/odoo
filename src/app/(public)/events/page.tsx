import { getPublicEvents } from '@/server/data/public/events';
import { expireStalePaymentHolds } from '@/server/services/holds';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Calendar, MapPin, Users, Ticket, ArrowRight } from 'lucide-react';

export default async function EventsPage() {
  await expireStalePaymentHolds().catch(() => {});
  const events = await getPublicEvents();

  return (
    <div className="py-12 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">Upcoming Events</h1>
        <p className="text-lg text-muted-foreground">
          Discover and join the latest activities hosted by the Skyline Student Association.
        </p>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-[var(--radius-xl)] border border-border shadow-sm">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-foreground">No upcoming events</h3>
          <p className="text-muted-foreground">Check back later for new activities!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map(event => (
            <Card key={event.id} className="overflow-hidden border-border bg-card hover:border-primary/30 card-hover flex flex-col">
              {event.bannerUrl ? (
                <div className="aspect-[16/9] w-full bg-muted relative overflow-hidden">
                  <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" />
                  <div className="absolute top-4 right-4 bg-background/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm">
                    {new Date(event.startsAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ) : (
                <div className="aspect-[16/9] w-full gradient-primary relative overflow-hidden flex items-center justify-center">
                  <Calendar className="w-16 h-16 text-white/20" />
                  <div className="absolute top-4 right-4 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm">
                    {new Date(event.startsAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              )}
              
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold mb-2 tracking-tight line-clamp-1">{event.title}</h3>
                <p className="text-muted-foreground text-sm line-clamp-2 mb-6 flex-1">
                  {event.description}
                </p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-foreground/80 font-medium">
                    <Calendar className="w-4 h-4 mr-3 text-primary" />
                    {new Date(event.startsAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-sm text-foreground/80 font-medium">
                    <MapPin className="w-4 h-4 mr-3 text-secondary" />
                    {event.venue}
                  </div>
                  <div className="flex items-center text-sm text-foreground/80 font-medium">
                    <Users className="w-4 h-4 mr-3 text-accent" />
                    Capacity: {event.capacity}
                  </div>
                </div>
                
                <Link 
                  href={`/events/${event.slug || event.id}`} 
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary/10 text-primary font-semibold rounded-[var(--radius-md)] hover:bg-primary hover:text-primary-foreground transition-colors mt-auto"
                >
                  <Ticket className="w-4 h-4" />
                  View Details
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
