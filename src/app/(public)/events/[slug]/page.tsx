import { getPublicEventBySlug } from '@/server/data/public/events';
import { expireStalePaymentHolds } from '@/server/services/holds';
import { notFound } from 'next/navigation';
import { getCaller } from '@/server/auth/guards';
import Link from 'next/link';
import { 
  Calendar, MapPin, Users, Ticket, CheckCircle2, 
  AlertTriangle, Shield, Lock, Sparkles, ArrowRight, ArrowLeft 
} from 'lucide-react';
import { TicketPurchaseForm } from './ticket-purchase-form';

export default async function EventDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  await expireStalePaymentHolds().catch(() => {});
  const { slug } = await params;
  const event = await getPublicEventBySlug(slug);
  if (!event) return notFound();

  const caller = await getCaller();
  const isMemberOrAdmin = caller.kind === 'user' && (caller.isMember || caller.isAdmin);
  const isLockedMembersOnly = event.membersOnly && !isMemberOrAdmin;

  const availableSeats = event.capacity - event.seatsSold - event.seatsHeld;
  const isAvailable = availableSeats > 0;

  const now = new Date();
  const salesOpenDate = new Date(event.salesOpenAt);
  const salesCloseDate = new Date(event.salesCloseAt);
  const isSalesNotOpenYet = now < salesOpenDate;
  const isSalesClosed = now > salesCloseDate;
  const canBuy = isAvailable && !isSalesNotOpenYet && !isSalesClosed && !isLockedMembersOnly;

  return (
    <div className="max-w-4xl mx-auto py-8 md:py-12 px-4 space-y-6">
      {/* Admin preview banner for draft/cancelled events */}
      {event.status !== 'published' && (
        <div className="p-4 rounded-[var(--radius-lg)] bg-amber-50 border border-amber-300 text-amber-900 flex items-center justify-between gap-4 text-xs font-medium">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Admin Preview Mode:</strong> This event is currently in{' '}
              <span className="uppercase font-bold">{event.status}</span> status and only visible to administrators.
            </span>
          </div>
          <Link
            href={`/admin/events/${event.id}`}
            className="px-3 py-1 bg-amber-600 text-white rounded-[var(--radius-md)] hover:bg-amber-700 transition-colors shrink-0"
          >
            Edit Event
          </Link>
        </div>
      )}

      {/* Members Only Access Banner */}
      {event.membersOnly && (
        <div className={`p-4 rounded-[var(--radius-lg)] border flex items-center justify-between gap-4 text-xs font-semibold ${
          isMemberOrAdmin
            ? 'bg-amber-50/90 border-amber-300 text-amber-950 dark:bg-amber-950/40 dark:text-amber-200'
            : 'bg-rose-50 border-rose-300 text-rose-950 dark:bg-rose-950/40 dark:text-rose-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>★ Members-Only Event:</strong>{' '}
              {isMemberOrAdmin
                ? 'Your active membership grants you full exclusive access to view and join this event.'
                : 'This event is strictly reserved for active club members only.'}
            </span>
          </div>
          {!isMemberOrAdmin && (
            <Link
              href={caller.kind === 'visitor' ? `/login?next=/events/${slug}` : '/account/membership'}
              className="px-3 py-1 bg-amber-600 text-white rounded-[var(--radius-md)] hover:bg-amber-700 transition-colors shrink-0 font-bold"
            >
              {caller.kind === 'visitor' ? 'Sign In' : 'Join Membership'}
            </Link>
          )}
        </div>
      )}

      {/* Banner */}
      {event.bannerUrl ? (
        <div className="w-full aspect-[21/9] rounded-[var(--radius-xl)] overflow-hidden shadow-sm relative">
          <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover" />
          {event.membersOnly && (
            <div className="absolute top-4 left-4 bg-amber-500/95 text-white font-bold backdrop-blur px-3 py-1 rounded-full text-xs shadow-sm flex items-center gap-1">
              ★ Members Only
            </div>
          )}
        </div>
      ) : (
        <div className="w-full aspect-[21/9] rounded-[var(--radius-xl)] gradient-hero shadow-sm flex items-center justify-center border border-border relative">
          <Calendar className="w-24 h-24 text-primary/20" />
          {event.membersOnly && (
            <div className="absolute top-4 left-4 bg-amber-500/95 text-white font-bold backdrop-blur px-3 py-1 rounded-full text-xs shadow-sm flex items-center gap-1">
              ★ Members Only
            </div>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-12">
        <div className="md:col-span-2 space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-4xl font-bold tracking-tight text-foreground">{event.title}</h1>
            </div>
            <div className="flex flex-wrap gap-4 text-sm font-medium text-muted-foreground mt-4">
              <span className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                <MapPin className="w-4 h-4 text-primary" /> {event.venue}
              </span>
              <span className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                <Calendar className="w-4 h-4 text-secondary" />{' '}
                {new Date(event.startsAt).toLocaleString('en-IN', {
                  timeZone: 'Asia/Kolkata',
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
          </div>

          <div className="prose prose-blue max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {event.description}
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-border p-6 rounded-[var(--radius-xl)] bg-card shadow-sm sticky top-24">
            <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-foreground">
              <Ticket className="w-5 h-5 text-primary" /> Tickets
            </h3>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <span className="text-muted-foreground font-medium">Member Price</span>
                <span className="font-bold text-lg text-success">
                  ₹{(event.memberPricePaise / 100).toFixed(2)}
                </span>
              </div>
              
              {!event.membersOnly ? (
                <div className="flex justify-between items-center pb-4 border-b border-border">
                  <span className="text-muted-foreground font-medium">Non-Member Price</span>
                  <span className="font-bold text-lg">
                    ₹{(event.nonMemberPricePaise / 100).toFixed(2)}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between items-center pb-4 border-b border-border">
                  <span className="text-muted-foreground font-medium">Non-Member Rate</span>
                  <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    Members Exclusive
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm font-semibold text-secondary">
                <Users className="w-4 h-4" /> {availableSeats} seats remaining
              </div>

              {/* Sales schedule note */}
              {isSalesNotOpenYet && (
                <div className="text-xs text-amber-700 flex items-center gap-1.5 bg-amber-50 p-2.5 rounded-[var(--radius-md)] border border-amber-200">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    Sales open on{' '}
                    {salesOpenDate.toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}

              {isSalesClosed && (
                <div className="text-xs text-destructive flex items-center gap-1.5 bg-destructive/10 p-2.5 rounded-[var(--radius-md)] border border-destructive/20">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Ticket sales have closed for this event.</span>
                </div>
              )}
            </div>

            {/* Check Authorization / Members-Only Locked State */}
            {isLockedMembersOnly ? (
              <div className="mt-6 p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 flex items-center justify-center mx-auto">
                  <Lock className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-foreground">
                  Members-Only Exclusive
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Only active club members can join this event. Activate your student membership to unlock access.
                </p>
                {caller.kind === 'visitor' ? (
                  <Link
                    href={`/login?next=/events/${slug}`}
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 shadow-xs"
                  >
                    <span>Sign In to Access</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <Link
                    href="/account/membership"
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 shadow-xs"
                  >
                    <span>Get Member Pass (₹500/yr)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            ) : caller.kind === 'visitor' ? (
              <div className="mt-6 space-y-3">
                <Link
                  href={`/login?next=/events/${slug}`}
                  className="flex items-center justify-center w-full bg-primary text-primary-foreground font-semibold px-4 py-3 rounded-[var(--radius-md)] hover:opacity-90 shadow-sm transition-opacity"
                >
                  Login to Buy
                </Link>
                <p className="text-xs text-center text-muted-foreground">
                  You must be logged in to purchase tickets.
                </p>
              </div>
            ) : (
              <TicketPurchaseForm
                eventId={event.id}
                memberPricePaise={event.memberPricePaise}
                nonMemberPricePaise={event.nonMemberPricePaise}
                maxTicketsPerUser={event.maxTicketsPerUser}
                availableSeats={availableSeats}
                isMember={caller.isMember}
                canBuy={canBuy}
                membersOnly={event.membersOnly}
                buttonLabel={
                  !isAvailable
                    ? 'Sold Out'
                    : isSalesNotOpenYet
                    ? 'Sales Not Started'
                    : isSalesClosed
                    ? 'Sales Closed'
                    : 'Buy Ticket Securely'
                }
              />
            )}

            {caller.kind !== 'visitor' && !caller.isMember && !event.membersOnly && (
              <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-[var(--radius-md)] text-sm">
                <p className="text-muted-foreground font-medium flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    Members save money on tickets!{' '}
                    <Link href="/account/membership" className="text-primary font-bold hover:underline">
                      Join now
                    </Link>
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
