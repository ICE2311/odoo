import { getPublicEvents } from '@/server/data/public/events';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { StatusBadge } from '@/components/status-badge';
import { formatPaise, formatDate } from '@/lib/format';
import { Calendar } from 'lucide-react';
import Link from 'next/link';

export default async function EventsPage() {
  const events = await getPublicEvents();

  if (events.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <PageHeader
          title="Events"
          subtitle="Upcoming events and gatherings"
        />
        <EmptyState
          icon={Calendar}
          title="No events scheduled"
          description="Check back soon for announcements about upcoming events."
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Events"
        subtitle={`${events.length} event${events.length !== 1 ? 's' : ''} coming up`}
      />

      <div className="grid gap-4">
        {events.map((event) => {
          const available = event.capacity - (event.seatsSold + event.seatsHeld);
          const isSoldOut = available <= 0;
          const status = isSoldOut ? 'sold_out' : 'open';

          return (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className="border border-border bg-card rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="flex gap-4">
                {event.bannerUrl && (
                  <div className="w-40 h-40 shrink-0 bg-muted overflow-hidden">
                    <img
                      src={event.bannerUrl}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-card-foreground">{event.title}</h3>
                      <StatusBadge status={status} />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {event.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">{formatDate(event.startsAt)}</p>
                      <p className="font-medium text-card-foreground">{event.venue}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">
                        {available} / {event.capacity} seats
                      </p>
                      <p className="font-semibold text-primary">
                        {formatPaise(event.memberPricePaise)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
