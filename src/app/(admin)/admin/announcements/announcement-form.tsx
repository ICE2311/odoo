'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Megaphone,
  ArrowLeft,
  Send,
  Save,
  Clock,
  Pin,
  Globe,
  Users,
  Mail,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  History,
} from 'lucide-react';
import {
  createAnnouncementAction,
  updateAnnouncementAction,
} from '@/server/actions/announcements';

interface AnnouncementFormProps {
  initialData?: {
    id: string;
    slug: string;
    title: string;
    bodyMarkdown: string;
    category: 'general' | 'meeting' | 'deadline' | 'event' | 'change_of_plan';
    audience: 'public' | 'members';
    channels: string[];
    pinned: boolean;
    status: 'draft' | 'scheduled' | 'published' | 'archived';
    scheduledFor: string | null;
    revisions?: Array<{
      id: string;
      title: string;
      bodyMarkdown: string;
      editedAt: string | Date;
      editor?: { name: string | null; email: string } | null;
    }>;
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function AnnouncementForm({ initialData }: AnnouncementFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [autoSlug, setAutoSlug] = useState(!isEditing);
  const [bodyMarkdown, setBodyMarkdown] = useState(initialData?.bodyMarkdown || '');
  const [category, setCategory] = useState<'general' | 'meeting' | 'deadline' | 'event' | 'change_of_plan'>(
    initialData?.category || 'general'
  );
  const [audience, setAudience] = useState<'public' | 'members'>(initialData?.audience || 'public');
  const [channelWeb, setChannelWeb] = useState(initialData?.channels.includes('web') ?? true);
  const [channelEmail, setChannelEmail] = useState(initialData?.channels.includes('email') ?? false);
  const [pinned, setPinned] = useState(initialData?.pinned ?? false);
  const [status, setStatus] = useState<'draft' | 'scheduled' | 'published' | 'archived'>(
    initialData?.status || 'published'
  );
  const [scheduledFor, setScheduledFor] = useState(
    initialData?.scheduledFor ? new Date(initialData.scheduledFor).toISOString().slice(0, 16) : ''
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (autoSlug) {
      setSlug(slugify(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const channels: string[] = [];
    if (channelWeb) channels.push('web');
    if (channelEmail) channels.push('email');

    if (channels.length === 0) {
      setErrorMsg('Please select at least one distribution channel (e.g. Web).');
      return;
    }

    if (status === 'scheduled' && !scheduledFor) {
      setErrorMsg('Please select a scheduled publish date and time.');
      return;
    }

    try {
      setSubmitting(true);

      if (isEditing && initialData) {
        await updateAnnouncementAction(initialData.id, {
          title: title.trim(),
          slug: slug.trim() || slugify(title),
          bodyMarkdown: bodyMarkdown.trim(),
          category,
          audience,
          channels,
          pinned,
          status,
          scheduledFor: status === 'scheduled' ? scheduledFor : null,
        });
      } else {
        await createAnnouncementAction({
          title: title.trim(),
          slug: slug.trim() || slugify(title),
          bodyMarkdown: bodyMarkdown.trim(),
          category,
          audience,
          channels,
          pinned,
          status,
          scheduledFor: status === 'scheduled' ? scheduledFor : null,
        });
      }

      router.push('/admin/announcements');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save announcement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <Link
        href="/admin/announcements"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Announcements
      </Link>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-950 font-medium flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>{errorMsg}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area (2 cols) */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-card border rounded-[var(--radius-xl)] p-5 shadow-xs space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual General Meeting & Board Elections"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 border rounded-[var(--radius-md)] text-sm font-semibold bg-card outline-none focus:ring-2 focus:ring-primary shadow-xs"
                />
              </div>

              {/* Slug */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    URL Slug
                  </label>
                  <button
                    type="button"
                    onClick={() => setAutoSlug(!autoSlug)}
                    className="text-[11px] text-primary hover:underline font-medium"
                  >
                    {autoSlug ? 'Customize slug' : 'Auto-derive from title'}
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                    /announcements/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => {
                      setAutoSlug(false);
                      setSlug(slugify(e.target.value));
                    }}
                    placeholder="annual-general-meeting"
                    className="w-full pl-36 pr-3.5 py-2 border rounded-[var(--radius-md)] text-xs font-mono bg-card outline-none focus:ring-2 focus:ring-primary shadow-xs"
                  />
                </div>
              </div>

              {/* Body Markdown */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Announcement Body (Markdown) *
                  </label>
                </div>
                <textarea
                  required
                  rows={12}
                  value={bodyMarkdown}
                  onChange={(e) => setBodyMarkdown(e.target.value)}
                  placeholder="Write your announcement content here. Markdown formatting like # Heading, **bold**, and bullet points are supported..."
                  className="w-full p-3.5 border rounded-[var(--radius-md)] text-sm font-mono bg-card outline-none focus:ring-2 focus:ring-primary resize-y shadow-xs"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Supports GitHub-flavored markdown with paragraphs, lists, and links.
                </p>
              </div>
            </div>

            {/* Revisions History (Edit mode only) */}
            {isEditing && initialData?.revisions && initialData.revisions.length > 0 && (
              <div className="bg-card border rounded-[var(--radius-xl)] p-5 shadow-xs space-y-3">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" /> Edit Revisions ({initialData.revisions.length})
                </h3>
                <div className="divide-y divide-border text-xs">
                  {initialData.revisions.map((rev) => (
                    <div key={rev.id} className="py-2 flex justify-between items-center text-muted-foreground">
                      <div>
                        <span className="font-medium text-foreground">Edited by {rev.editor?.name || rev.editor?.email || 'Admin'}</span>
                        <div className="text-[11px] italic mt-0.5">&quot;{rev.title}&quot;</div>
                      </div>
                      <span className="text-[11px] font-mono">
                        {new Date(rev.editedAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Settings Sidebar (1 col) */}
          <div className="space-y-5">
            {/* Publishing Controls */}
            <div className="bg-card border rounded-[var(--radius-xl)] p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-foreground">Publishing Status</h3>

              <div className="space-y-2">
                <label
                  className={`flex items-center gap-2 p-2.5 border rounded-[var(--radius-md)] cursor-pointer text-xs ${
                    status === 'published' ? 'border-primary bg-primary/5 font-semibold text-primary' : 'bg-muted/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value="published"
                    checked={status === 'published'}
                    onChange={() => setStatus('published')}
                    className="text-primary"
                  />
                  <span>Publish Immediately</span>
                </label>

                <label
                  className={`flex items-center gap-2 p-2.5 border rounded-[var(--radius-md)] cursor-pointer text-xs ${
                    status === 'draft' ? 'border-primary bg-primary/5 font-semibold text-primary' : 'bg-muted/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value="draft"
                    checked={status === 'draft'}
                    onChange={() => setStatus('draft')}
                    className="text-primary"
                  />
                  <span>Save as Draft</span>
                </label>

                <label
                  className={`flex items-center gap-2 p-2.5 border rounded-[var(--radius-md)] cursor-pointer text-xs ${
                    status === 'scheduled' ? 'border-primary bg-primary/5 font-semibold text-primary' : 'bg-muted/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value="scheduled"
                    checked={status === 'scheduled'}
                    onChange={() => setStatus('scheduled')}
                    className="text-primary"
                  />
                  <span>Schedule for Future Date</span>
                </label>
              </div>

              {status === 'scheduled' && (
                <div className="pt-2 border-t space-y-1.5">
                  <label className="block text-xs font-bold text-foreground">
                    Scheduled Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required={status === 'scheduled'}
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded-[var(--radius-md)] text-xs bg-card outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              {/* Pin to Top */}
              <div className="pt-3 border-t">
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pinned}
                    onChange={(e) => setPinned(e.target.checked)}
                    className="rounded border-border text-primary"
                  />
                  <span className="flex items-center gap-1.5 text-foreground font-semibold">
                    <Pin className="w-3.5 h-3.5 text-amber-500" /> Pin to top of announcements
                  </span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-[var(--radius-md)] text-xs hover:bg-primary/90 transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : status === 'published' ? (
                    <>
                      <Send className="w-3.5 h-3.5" /> {isEditing ? 'Save & Publish' : 'Publish Announcement'}
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" /> {isEditing ? 'Save Changes' : 'Save Announcement'}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Category & Audience */}
            <div className="bg-card border rounded-[var(--radius-xl)] p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-foreground">Metadata & Distribution</h3>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-[var(--radius-md)] text-xs bg-card outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="general">General Bulletin</option>
                  <option value="meeting">Club Meeting</option>
                  <option value="deadline">Registration Deadline</option>
                  <option value="event">Special Event</option>
                  <option value="change_of_plan">Change of Plan / Alert</option>
                </select>
              </div>

              {/* Audience */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Audience Scope
                </label>
                <div className="space-y-1.5">
                  <label
                    className={`flex items-start gap-2 p-2 border rounded-[var(--radius-md)] cursor-pointer text-xs ${
                      audience === 'public' ? 'border-primary bg-primary/5 font-semibold' : 'bg-muted/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="audience"
                      value="public"
                      checked={audience === 'public'}
                      onChange={() => setAudience('public')}
                      className="mt-0.5 text-primary"
                    />
                    <div>
                      <div className="flex items-center gap-1 text-foreground font-semibold">
                        <Globe className="w-3.5 h-3.5 text-emerald-600" /> Public
                      </div>
                      <div className="text-[11px] text-muted-foreground font-normal">
                        Visible to all visitors, students, and members.
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2 p-2 border rounded-[var(--radius-md)] cursor-pointer text-xs ${
                      audience === 'members' ? 'border-primary bg-primary/5 font-semibold' : 'bg-muted/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="audience"
                      value="members"
                      checked={audience === 'members'}
                      onChange={() => setAudience('members')}
                      className="mt-0.5 text-primary"
                    />
                    <div>
                      <div className="flex items-center gap-1 text-indigo-700 font-semibold">
                        <Users className="w-3.5 h-3.5" /> Members Only
                      </div>
                      <div className="text-[11px] text-muted-foreground font-normal">
                        Only logged-in users with active club memberships can view.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Channels */}
              <div className="pt-2 border-t space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Broadcast Channels
                </label>
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channelWeb}
                    onChange={(e) => setChannelWeb(e.target.checked)}
                    className="rounded border-border text-primary"
                  />
                  <span className="text-foreground">Web Announcement Board</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channelEmail}
                    onChange={(e) => setChannelEmail(e.target.checked)}
                    className="rounded border-border text-primary"
                  />
                  <span className="flex items-center gap-1 text-foreground">
                    <Mail className="w-3.5 h-3.5 text-blue-600" /> Email Broadcast to Opted-in Users
                  </span>
                </label>
                {channelEmail && (
                  <p className="text-[11px] text-blue-700 bg-blue-50 border border-blue-200 p-2 rounded-md">
                    Will enqueue notification emails to all {audience === 'public' ? 'subscribed students' : 'active members'}.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

