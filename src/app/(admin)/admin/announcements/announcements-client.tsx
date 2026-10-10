'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Megaphone,
  Plus,
  Search,
  Pin,
  PinOff,
  Edit2,
  Trash2,
  ExternalLink,
  Users,
  Globe,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
} from 'lucide-react';
import {
  deleteAnnouncementAction,
  togglePinAnnouncementAction,
  broadcastAnnouncementAction,
  triggerFlushEmailOutboxAction,
} from '@/server/actions/announcements';

interface AnnouncementItem {
  id: string;
  slug: string;
  title: string;
  bodyMarkdown: string;
  category: 'general' | 'meeting' | 'deadline' | 'event' | 'change_of_plan';
  audience: 'public' | 'members';
  channels: string[];
  pinned: boolean;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  scheduledFor: Date | string | null;
  publishedAt: Date | string | null;
  createdAt: Date | string;
  author?: { id: string; name: string | null; email: string } | null;
  revisions?: Array<{ id: string; editedAt: Date | string }>;
  delivery?: {
    recipientsCount: number;
    sentCount: number;
    failedCount: number;
    startedAt: Date | string;
    finishedAt: Date | string | null;
  } | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-slate-100 text-slate-800 border-slate-200',
  meeting: 'bg-blue-50 text-blue-800 border-blue-200',
  deadline: 'bg-rose-50 text-rose-800 border-rose-200',
  event: 'bg-purple-50 text-purple-800 border-purple-200',
  change_of_plan: 'bg-amber-50 text-amber-800 border-amber-200',
};

export function AnnouncementsClient({ initialList }: { initialList: AnnouncementItem[] }) {
  const router = useRouter();
  const [list, setList] = useState<AnnouncementItem[]>(initialList);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'scheduled' | 'archived'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isPending, startTransition] = useTransition();
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const handleTogglePin = (id: string, currentPin: boolean) => {
    setActionLoadingId(id);
    startTransition(async () => {
      try {
        const res = await togglePinAnnouncementAction(id);
        setList((prev) =>
          prev.map((item) => (item.id === id ? { ...item, pinned: res.pinned } : item))
        );
      } catch (err: any) {
        alert(err.message || 'Failed to toggle pin');
      } finally {
        setActionLoadingId(null);
      }
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }
    setActionLoadingId(id);
    startTransition(async () => {
      try {
        await deleteAnnouncementAction(id);
        setList((prev) => prev.filter((item) => item.id !== id));
      } catch (err: any) {
        alert(err.message || 'Failed to delete announcement');
      } finally {
        setActionLoadingId(null);
      }
    });
  };

  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const handleBroadcast = (id: string, title: string) => {
    if (!window.confirm(`Broadcast announcement "${title}" via email to all subscribers?`)) {
      return;
    }
    setActionLoadingId(`broadcast-${id}`);
    setStatusNotice(null);
    startTransition(async () => {
      try {
        const res = await broadcastAnnouncementAction(id);
        setStatusNotice(res.message);
        router.refresh();
      } catch (err: any) {
        alert(err.message || 'Failed to broadcast announcement');
      } finally {
        setActionLoadingId(null);
      }
    });
  };

  const handleFlushOutbox = () => {
    setActionLoadingId('flush');
    setStatusNotice(null);
    startTransition(async () => {
      try {
        const res = await triggerFlushEmailOutboxAction();
        setStatusNotice(`Email queue processed: Sent ${res.sent}, Failed ${res.failed}.`);
        router.refresh();
      } catch (err: any) {
        alert(err.message || 'Failed to process email queue');
      } finally {
        setActionLoadingId(null);
      }
    });
  };

  const filtered = list.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSlug = item.slug.toLowerCase().includes(q);
      const matchBody = item.bodyMarkdown.toLowerCase().includes(q);
      return matchTitle || matchSlug || matchBody;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-muted rounded-[var(--radius-lg)] border text-xs font-medium overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-[var(--radius-md)] transition-colors whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-card text-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All ({list.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('published')}
            className={`px-3 py-1.5 rounded-[var(--radius-md)] transition-colors whitespace-nowrap ${
              statusFilter === 'published'
                ? 'bg-card text-success font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Published ({list.filter((a) => a.status === 'published').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('draft')}
            className={`px-3 py-1.5 rounded-[var(--radius-md)] transition-colors whitespace-nowrap ${
              statusFilter === 'draft'
                ? 'bg-card text-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Drafts ({list.filter((a) => a.status === 'draft').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('scheduled')}
            className={`px-3 py-1.5 rounded-[var(--radius-md)] transition-colors whitespace-nowrap ${
              statusFilter === 'scheduled'
                ? 'bg-card text-indigo-600 font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Scheduled ({list.filter((a) => a.status === 'scheduled').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('archived')}
            className={`px-3 py-1.5 rounded-[var(--radius-md)] transition-colors whitespace-nowrap ${
              statusFilter === 'archived'
                ? 'bg-card text-muted-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Archived ({list.filter((a) => a.status === 'archived').length})
          </button>
        </div>

        {/* Actions & Search */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFlushOutbox}
            disabled={actionLoadingId === 'flush'}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-[var(--radius-md)] border border-primary/20 transition-colors disabled:opacity-50 whitespace-nowrap shadow-xs"
            title="Immediately send any pending queued emails in the database"
          >
            <Send className={`w-3.5 h-3.5 ${actionLoadingId === 'flush' ? 'animate-spin' : ''}`} />
            {actionLoadingId === 'flush' ? 'Sending...' : 'Flush Outbox'}
          </button>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search announcements..."
              className="w-full pl-9 pr-4 py-2 border rounded-[var(--radius-md)] bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-primary shadow-xs"
            />
          </div>
        </div>
      </div>

      {statusNotice && (
        <div className="flex items-center justify-between p-3.5 bg-blue-50 border border-blue-200 text-blue-900 text-xs font-medium rounded-[var(--radius-lg)]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>{statusNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusNotice(null)}
            className="text-blue-500 hover:text-blue-800 font-bold ml-2 text-base leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* Announcements Table */}
      <div className="bg-card border rounded-[var(--radius-xl)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted border-b">
              <tr>
                <th className="px-5 py-3 font-semibold text-muted-foreground">Announcement</th>
                <th className="px-5 py-3 font-semibold text-muted-foreground">Audience & Category</th>
                <th className="px-5 py-3 font-semibold text-muted-foreground">Channels & Delivery</th>
                <th className="px-5 py-3 font-semibold text-muted-foreground">Status & Date</th>
                <th className="px-5 py-3 font-semibold text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-muted/60 transition-colors">
                  {/* Title & Slug */}
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleTogglePin(item.id, item.pinned)}
                        disabled={actionLoadingId === item.id}
                        title={item.pinned ? 'Unpin Announcement' : 'Pin to top'}
                        className={`p-1 rounded-md transition-colors ${
                          item.pinned
                            ? 'text-amber-500 hover:bg-amber-50'
                            : 'text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {item.pinned ? <Pin className="w-4 h-4 fill-amber-500" /> : <Pin className="w-4 h-4" />}
                      </button>

                      <div className="min-w-0 max-w-sm">
                        <div className="font-semibold text-foreground truncate flex items-center gap-1.5">
                          <span>{item.title}</span>
                          {item.revisions && item.revisions.length > 0 && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono"
                              title={`${item.revisions.length} revision(s)`}
                            >
                              v{item.revisions.length + 1}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate font-mono mt-0.5">
                          /announcements/{item.slug}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Audience & Category */}
                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        {item.audience === 'public' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Globe className="w-3 h-3" /> Public
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
                            <Users className="w-3 h-3" /> Members Only
                          </span>
                        )}

                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border ${
                            CATEGORY_COLORS[item.category] || 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {item.category.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Channels & Delivery */}
                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        {item.channels.includes('web') && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-foreground">
                            Web
                          </span>
                        )}
                        {item.channels.includes('email') && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                            <Mail className="w-3 h-3" /> Email
                          </span>
                        )}
                      </div>

                      {item.delivery && (
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>
                            Broadcasted to <strong>{item.delivery.recipientsCount}</strong> recipients
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Status & Date */}
                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-[var(--radius-md)] text-xs font-semibold uppercase tracking-wider ${
                          item.status === 'published'
                            ? 'bg-success/10 text-success border border-success/30'
                            : item.status === 'scheduled'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : item.status === 'draft'
                            ? 'bg-muted text-muted-foreground border'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.status}
                      </span>

                      <div className="text-xs text-muted-foreground">
                        {item.publishedAt ? (
                          <span>
                            {new Date(item.publishedAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        ) : item.scheduledFor ? (
                          <span className="flex items-center gap-1 text-indigo-700">
                            <Clock className="w-3 h-3" />
                            {new Date(item.scheduledFor).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        ) : (
                          <span>Created {new Date(item.createdAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </td>

                    {/* Actions */}
                  <td className="px-5 py-4 text-right space-x-1.5">
                    {item.status === 'published' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleBroadcast(item.id, item.title)}
                          disabled={actionLoadingId === `broadcast-${item.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors disabled:opacity-50"
                          title="Broadcast announcement email to all subscribed users"
                        >
                          <Mail className={`w-3 h-3 ${actionLoadingId === `broadcast-${item.id}` ? 'animate-spin' : ''}`} />
                          {actionLoadingId === `broadcast-${item.id}` ? 'Sending...' : 'Email'}
                        </button>

                        <Link
                          href={`/announcements/${item.slug}`}
                          target="_blank"
                          className="inline-flex items-center p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                          title="View Public Post"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </>
                    )}

                    <Link
                      href={`/admin/announcements/${item.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.title)}
                      disabled={actionLoadingId === item.id}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete Announcement"
                    >
                      {actionLoadingId === item.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No announcements found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

