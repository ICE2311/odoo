'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  Image as ImageIcon,
  Users,
  IndianRupee,
  Sparkles,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { createEventAction, updateEventAction } from '@/server/actions/admin-events';

function toDateTimeLocal(d: Date | string | null | undefined): string {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function EventForm({ event }: { event?: any }) {
  const router = useRouter();
  const isEdit = !!event?.id;

  const [title, setTitle] = useState(event?.title || '');
  const [slug, setSlug] = useState(event?.slug || '');
  const [description, setDescription] = useState(event?.description || '');
  const [venue, setVenue] = useState(event?.venue || '');
  const [bannerUrl, setBannerUrl] = useState(event?.bannerUrl || '');
  const [capacity, setCapacity] = useState(event?.capacity ? String(event.capacity) : '100');
  const [maxTicketsPerUser, setMaxTicketsPerUser] = useState(
    event?.maxTicketsPerUser ? String(event.maxTicketsPerUser) : '4'
  );
  const [memberPriceRupees, setMemberPriceRupees] = useState(
    event?.memberPricePaise !== undefined ? (event.memberPricePaise / 100).toString() : '150'
  );
  const [nonMemberPriceRupees, setNonMemberPriceRupees] = useState(
    event?.nonMemberPricePaise !== undefined ? (event.nonMemberPricePaise / 100).toString() : '300'
  );
  const [status, setStatus] = useState<string>(event?.status || 'draft');

  // Dates
  const now = new Date();
  const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const oneWeekLaterEnd = new Date(oneWeekLater.getTime() + 3 * 60 * 60 * 1000);

  const [startsAt, setStartsAt] = useState(toDateTimeLocal(event?.startsAt || oneWeekLater));
  const [endsAt, setEndsAt] = useState(toDateTimeLocal(event?.endsAt || oneWeekLaterEnd));
  const [salesOpenAt, setSalesOpenAt] = useState(toDateTimeLocal(event?.salesOpenAt || now));
  const [salesCloseAt, setSalesCloseAt] = useState(toDateTimeLocal(event?.salesCloseAt || oneWeekLater));

  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEdit && (!slug || slug === slugify(title))) {
      setSlug(slugify(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = {
      title,
      slug: slugify(slug),
      description,
      venue,
      bannerUrl: bannerUrl || undefined,
      capacity: parseInt(capacity, 10),
      maxTicketsPerUser: parseInt(maxTicketsPerUser, 10),
      memberPricePaise: Math.round(parseFloat(memberPriceRupees || '0') * 100),
      nonMemberPricePaise: Math.round(parseFloat(nonMemberPriceRupees || '0') * 100),
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      salesOpenAt: new Date(salesOpenAt),
      salesCloseAt: new Date(salesCloseAt),
      status,
    };

    startTransition(async () => {
      try {
        if (isEdit) {
          await updateEventAction(event.id, payload);
          setSuccessMsg('Event updated successfully!');
          router.refresh();
        } else {
          const res = await createEventAction(payload);
          setSuccessMsg('Event created successfully! Redirecting...');
          router.push(`/admin/events/${res.eventId}`);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'An error occurred while saving the event.');
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Link>

        {isEdit && (
          <div className="flex items-center gap-2">
            <Link
              href={`/events/${slug}`}
              target="_blank"
              className="text-xs font-semibold px-3 py-1.5 rounded-[var(--radius-md)] border hover:bg-muted text-foreground transition-colors"
            >
              Public Page ↗
            </Link>
            <Link
              href={`/admin/events/${event.id}/door-staff`}
              className="text-xs font-semibold px-3 py-1.5 rounded-[var(--radius-md)] bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              Door Staff ({event.doorStaffCount ?? 'Manage'})
            </Link>
          </div>
        )}
      </div>

      <div className="bg-card border rounded-[var(--radius-xl)] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/30">
          <h1 className="text-xl font-bold text-foreground">
            {isEdit ? `Edit Event: ${event.title}` : 'Create New Event'}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Configure event details, ticket prices, schedules, and capacity.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-[var(--radius-md)] bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-[var(--radius-md)] bg-success/10 border border-success/20 text-success text-sm flex items-center gap-2">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Title & Slug */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Event Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Annual Tech Symposium 2025"
                className="w-full px-3 py-2 border rounded-[var(--radius-md)] bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                URL Slug *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  placeholder="annual-tech-symposium-2025"
                  className="w-full px-3 py-2 border rounded-[var(--radius-md)] bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-primary font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setSlug(slugify(title))}
                  className="px-2.5 py-1 text-xs border rounded-[var(--radius-md)] hover:bg-muted text-muted-foreground whitespace-nowrap"
                  title="Generate from title"
                >
                  Sync
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Description & Highlights *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide event details, schedule highlights, speaker info, etc."
              className="w-full px-3 py-2 border rounded-[var(--radius-md)] bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-primary resize-y"
            />
          </div>

          {/* Venue & Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-primary" /> Venue / Location *
              </label>
              <input
                type="text"
                required
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Main Auditorium, Block 3"
                className="w-full px-3 py-2 border rounded-[var(--radius-md)] bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-primary" /> Banner Image URL
              </label>
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full px-3 py-2 border rounded-[var(--radius-md)] bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Event Dates */}
          <div className="p-4 bg-muted/40 border rounded-[var(--radius-lg)] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Event Schedule & Sales Window
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Starts At *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="w-full px-3 py-2 border rounded-[var(--radius-md)] bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Ends At *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="w-full px-3 py-2 border rounded-[var(--radius-md)] bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Sales Open At *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={salesOpenAt}
                  onChange={(e) => setSalesOpenAt(e.target.value)}
                  className="w-full px-3 py-2 border rounded-[var(--radius-md)] bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Sales Close At *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={salesCloseAt}
                  onChange={(e) => setSalesCloseAt(e.target.value)}
                  className="w-full px-3 py-2 border rounded-[var(--radius-md)] bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Capacity and Pricing */}
          <div className="p-4 bg-muted/40 border rounded-[var(--radius-lg)] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5" /> Pricing & Capacity
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-primary" /> Total Capacity *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full px-3 py-2 border rounded-[var(--radius-md)] bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Max per User *
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={maxTicketsPerUser}
                  onChange={(e) => setMaxTicketsPerUser(e.target.value)}
                  className="w-full px-3 py-2 border rounded-[var(--radius-md)] bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Member Price (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={memberPriceRupees}
                  onChange={(e) => setMemberPriceRupees(e.target.value)}
                  className="w-full px-3 py-2 border rounded-[var(--radius-md)] bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-primary font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Non-Member Price (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={nonMemberPriceRupees}
                  onChange={(e) => setNonMemberPriceRupees(e.target.value)}
                  className="w-full px-3 py-2 border rounded-[var(--radius-md)] bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-primary font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Publication Status
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['draft', 'published', 'completed', 'cancelled'] as const).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`py-2 px-3 border rounded-[var(--radius-md)] text-xs font-semibold capitalize transition-all ${
                    status === s
                      ? s === 'published'
                        ? 'bg-success/15 border-success text-success shadow-xs'
                        : s === 'cancelled'
                        ? 'bg-destructive/15 border-destructive text-destructive shadow-xs'
                        : 'bg-primary/15 border-primary text-primary shadow-xs'
                      : 'bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t flex justify-end gap-3">
            <Link
              href="/admin/events"
              className="px-4 py-2 border rounded-[var(--radius-md)] text-sm font-medium hover:bg-muted text-foreground transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-[var(--radius-md)] text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-xs"
            >
              {isPending
                ? isEdit
                  ? 'Saving Changes...'
                  : 'Creating Event...'
                : isEdit
                ? 'Save Event Changes'
                : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

