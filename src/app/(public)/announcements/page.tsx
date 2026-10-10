import { getPublishedAnnouncements } from '@/server/data/public/announcements';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { Bell, Pin } from 'lucide-react';
import Link from 'next/link';
import { formatDateTime } from '@/lib/format';

export default async function AnnouncementsPage() {
  const announcements = await getPublishedAnnouncements();

  const pinnedAnnouncements = announcements.filter((a) => a.pinned);
  const regularAnnouncements = announcements.filter((a) => !a.pinned);

  return (
    <div className="max-w-3xl mx-auto py-8">
      <PageHeader
        title="Announcements"
        subtitle="Stay updated with the latest news and updates from Skyline."
      />

      {announcements.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No announcements yet"
          description="Check back soon for important updates."
        />
      ) : (
        <div className="space-y-12">
          {pinnedAnnouncements.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
                <Pin className="w-4 h-4" /> Pinned
              </h2>
              <div className="space-y-4">
                {pinnedAnnouncements.map((announcement) => (
                  <Link
                    key={announcement.id}
                    href={`/announcements/${announcement.slug}`}
                    className="block p-6 border border-primary/30 bg-primary/5 rounded-[var(--radius-xl)] hover:border-primary hover:shadow-md transition-all card-hover"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-foreground truncate">
                          {announcement.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {announcement.bodyMarkdown}
                        </p>
                        <div className="flex items-center gap-4 mt-4 text-xs font-medium text-muted-foreground">
                          <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary" /> {announcement.author?.name || 'Skyline'}</span>
                          <span>{formatDateTime(announcement.publishedAt!)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {regularAnnouncements.length > 0 && (
            <section>
              {pinnedAnnouncements.length > 0 && (
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">
                  Recent
                </h2>
              )}
              <div className="space-y-4">
                {regularAnnouncements.map((announcement) => (
                  <Link
                    key={announcement.id}
                    href={`/announcements/${announcement.slug}`}
                    className="block p-6 border border-border bg-card rounded-[var(--radius-xl)] shadow-sm hover:border-primary/30 transition-all card-hover"
                  >
                    <h3 className="text-lg font-bold text-foreground truncate">
                      {announcement.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {announcement.bodyMarkdown}
                    </p>
                    <div className="flex items-center gap-4 mt-4 text-xs font-medium text-muted-foreground">
                      <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-secondary/10 text-secondary">
                        {announcement.category}
                      </span>
                      <span>{announcement.author?.name || 'Skyline'}</span>
                      <span>{formatDateTime(announcement.publishedAt!)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
