import { requireAdmin } from '@/server/auth/guards';
import { AnnouncementForm } from '../announcement-form';

export default async function NewAnnouncementPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          New Announcement
        </h1>
        <p className="text-muted-foreground text-sm">
          Draft a new announcement, set audience scoping, and broadcast via email.
        </p>
      </div>

      <AnnouncementForm />
    </div>
  );
}

