import { requireAdmin } from '@/server/auth/guards';
import { getAdminAnnouncements } from '@/server/data/admin/announcements';
import { AnnouncementsClient } from './announcements-client';
import Link from 'next/link';
import { Megaphone, Plus, Send, CheckCircle2, Clock, Users } from 'lucide-react';

export default async function AdminAnnouncementsPage() {
  await requireAdmin();
  const list = await getAdminAnnouncements();

  const total = list.length;
  const published = list.filter((a) => a.status === 'published').length;
  const drafts = list.filter((a) => a.status === 'draft' || a.status === 'scheduled').length;
  const totalBroadcasts = list.reduce(
    (acc, a) => acc + (a.delivery ? a.delivery.recipientsCount : 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Megaphone className="w-6 h-6 text-primary" /> Announcements & Broadcasts
          </h1>
          <p className="text-muted-foreground text-sm">
            Publish club news, schedule members-only bulletins, and broadcast announcements via email.
          </p>
        </div>

        <Link
          href="/admin/announcements/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create Announcement
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border rounded-[var(--radius-xl)] p-4 shadow-xs">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Posts
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">{total}</div>
        </div>

        <div className="bg-card border rounded-[var(--radius-xl)] p-4 shadow-xs">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" /> Published
          </div>
          <div className="text-2xl font-bold text-success mt-1">{published}</div>
        </div>

        <div className="bg-card border rounded-[var(--radius-xl)] p-4 shadow-xs">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-indigo-600" /> Drafts & Scheduled
          </div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{drafts}</div>
        </div>

        <div className="bg-card border rounded-[var(--radius-xl)] p-4 shadow-xs">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Send className="w-3.5 h-3.5 text-primary" /> Emails Broadcasted
          </div>
          <div className="text-2xl font-bold text-primary mt-1">{totalBroadcasts}</div>
        </div>
      </div>

      {/* Main List */}
      <AnnouncementsClient initialList={list as any} />
    </div>
  );
}

