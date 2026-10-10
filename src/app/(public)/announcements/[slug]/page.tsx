import { getPublishedAnnouncementBySlug } from '@/server/data/public/announcements';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pin, Calendar, User, Clock, Users, Globe } from 'lucide-react';
import { formatDateTime } from '@/lib/format';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PublicAnnouncementDetailPage({ params }: Props) {
  const { slug } = await params;
  const announcement = await getPublishedAnnouncementBySlug(slug);

  if (!announcement) {
    notFound();
  }

  const latestRevision = announcement.revisions?.[0];

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/announcements"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Announcements
        </Link>
      </div>

      {/* Main Card */}
      <article className="bg-card border border-border rounded-[var(--radius-2xl)] p-6 sm:p-10 shadow-sm space-y-6">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {announcement.pinned && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <Pin className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Pinned
            </span>
          )}

          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-secondary/10 text-secondary">
            {announcement.category.replace(/_/g, ' ')}
          </span>

          {announcement.audience === 'members' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
              <Users className="w-3 h-3" /> Members Only
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {announcement.title}
        </h1>

        {/* Meta / Author / Published Info */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-muted-foreground border-y border-border py-3">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              {(announcement.author?.name || 'S')[0].toUpperCase()}
            </div>
            <span>{announcement.author?.name || 'Skyline Student Association'}</span>
          </div>

          {announcement.publishedAt && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDateTime(announcement.publishedAt)}</span>
            </div>
          )}

          {latestRevision && (
            <div className="flex items-center gap-1.5 text-muted-foreground/80 italic">
              <Clock className="w-3.5 h-3.5" />
              <span>Edited on {formatDateTime(latestRevision.editedAt)}</span>
            </div>
          )}
        </div>

        {/* Body content */}
        <div className="prose prose-slate max-w-none text-foreground whitespace-pre-wrap font-sans text-sm sm:text-base leading-relaxed">
          {announcement.bodyMarkdown}
        </div>
      </article>
    </div>
  );
}

