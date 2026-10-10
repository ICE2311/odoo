import { db } from '@/server/db';
import { announcements } from '@/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { requireAdmin } from '@/server/auth/guards';

export async function getAdminAnnouncements() {
  await requireAdmin();

  const list = await db.query.announcements.findMany({
    with: {
      author: {
        columns: { id: true, name: true, email: true },
      },
      revisions: {
        columns: { id: true, editedAt: true },
      },
      delivery: true,
    },
    orderBy: [desc(announcements.pinned), desc(announcements.createdAt)],
  });

  return list;
}

export async function getAdminAnnouncementById(id: string) {
  await requireAdmin();

  const item = await db.query.announcements.findFirst({
    where: eq(announcements.id, id),
    with: {
      author: {
        columns: { id: true, name: true, email: true },
      },
      revisions: {
        with: {
          editor: {
            columns: { id: true, name: true, email: true },
          },
        },
        orderBy: (revisions, { desc }) => [desc(revisions.editedAt)],
      },
      delivery: true,
    },
  });

  return item || null;
}

