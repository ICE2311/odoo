import { getPublishedAnnouncements } from '@/server/data/public/announcements';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { formatDateTime } from '@/lib/format';

export default async function AnnouncementsPage() {
  const announcements = await getPublishedAnnouncements();

  const pinnedAnnouncements = announcements.filter((a) => a.pinned);
  const regularAnnouncements = announcements.filter((a) => !a.pinned);

  return (
    <div className="max-w-3xl mx-auto">
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
        <div className="space-y-8">
          {pinnedAnnouncements.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
                Pinned
              </h2>
              <div className="space-y-3">
                {pinnedAnnouncements.map((announcement) => (
                  <Link
                    key={announcement.id}
                    href={`/announcements/${announcement.slug}`}
                    className="block p-4 border border-border bg-card rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-card-foreground truncate">
                          {announcement.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {announcement.bodyMarkdown}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span>{announcement.author?.name || 'Skyline'}</span>
                          <span>{formatDateTime(announcement.publishedAt!)}</span>
                        </div>
                      </div>
                      <div className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {regularAnnouncements.length > 0 && (
            <section>
              {pinnedAnnouncements.length > 0 && (
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
                  Recent
                </h2>
              )}
              <div className="space-y-3">
                {regularAnnouncements.map((announcement) => (
                  <Link
                    key={announcement.id}
                    href={`/announcements/${announcement.slug}`}
                    className="block p-4 border border-border bg-card rounded-lg hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-semibold text-card-foreground truncate">
                      {announcement.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {announcement.bodyMarkdown}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-secondary text-secondary-foreground">
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
