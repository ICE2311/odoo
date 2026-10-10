import { requireAdmin } from '@/server/auth/guards';
import { getAdminAnnouncementById } from '@/server/data/admin/announcements';
import { AnnouncementForm } from '../announcement-form';
import { notFound } from 'next/navigation';

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const item = await getAdminAnnouncementById(id);

  if (!item) {
    notFound();
  }

  const formattedData = {
    id: item.id,
    slug: item.slug,
    title: item.title,
    bodyMarkdown: item.bodyMarkdown,
    category: item.category as any,
    audience: item.audience as any,
    channels: item.channels,
    pinned: item.pinned,
    status: item.status as any,
    scheduledFor: item.scheduledFor ? item.scheduledFor.toISOString() : null,
    revisions: item.revisions?.map((r) => ({
      id: r.id,
      title: r.title,
      bodyMarkdown: r.bodyMarkdown,
      editedAt: r.editedAt.toISOString(),
      editor: r.editor,
    })),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Edit Announcement
        </h1>
        <p className="text-muted-foreground text-sm">
          Update announcement details, publish drafts, or view editorial revisions.
        </p>
      </div>

      <AnnouncementForm initialData={formattedData} />
    </div>
  );
}

