import { db } from '../../db';
import { announcements } from '../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCaller } from '../../auth/guards';

/**
 * Get published announcements visible to the current user.
 * Visitors see 'public' audience only; members see 'public' + 'members'.
 */
export async function getPublishedAnnouncements() {
  const caller = await getCaller();
  const isMember = caller.kind === 'user' && caller.isMember;

  const announcementList = await db.query.announcements.findMany({
    where: and(
      eq(announcements.status, 'published'),
      isMember ? undefined : eq(announcements.audience, 'public')
    ),
    with: {
      author: {
        columns: { name: true, email: true },
      },
    },
    orderBy: [desc(announcements.pinned), desc(announcements.publishedAt)],
  });

  return announcementList;
}

export async function getPublishedAnnouncementBySlug(slug: string) {
  const caller = await getCaller();
  const isMember = caller.kind === 'user' && caller.isMember;

  const announcement = await db.query.announcements.findFirst({
    where: and(
      eq(announcements.slug, slug),
      eq(announcements.status, 'published'),
      isMember ? undefined : eq(announcements.audience, 'public')
    ),
    with: {
      author: {
        columns: { name: true, email: true },
      },
      revisions: {
        columns: { id: true, editedAt: true },
        orderBy: (revisions, { desc }) => [desc(revisions.editedAt)],
        limit: 1,
      },
    },
  });

  return announcement || null;
}



