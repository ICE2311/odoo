'use server';

import { db } from '@/server/db';
import {
  announcements,
  announcementRevisions,
  announcementDeliveries,
  users,
  memberships,
  auditLog,
} from '@/server/db/schema';
import { requireAdmin } from '@/server/auth/guards';
import { eq, and, lte, gt, inArray } from 'drizzle-orm';
import { enqueueEmail } from '@/server/services/email';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  slug: z.string().min(1, 'Slug is required').max(200),
  bodyMarkdown: z.string().min(1, 'Announcement body is required'),
  category: z.enum(['general', 'meeting', 'deadline', 'event', 'change_of_plan']),
  audience: z.enum(['public', 'members']),
  channels: z.array(z.string()).min(1, 'At least one channel must be selected'),
  pinned: z.boolean().default(false),
  status: z.enum(['draft', 'scheduled', 'published', 'archived']).default('published'),
  scheduledFor: z.string().optional().nullable(),
});

export async function createAnnouncementAction(formData: {
  title: string;
  slug?: string;
  bodyMarkdown: string;
  category: 'general' | 'meeting' | 'deadline' | 'event' | 'change_of_plan';
  audience: 'public' | 'members';
  channels: string[];
  pinned?: boolean;
  status?: 'draft' | 'scheduled' | 'published' | 'archived';
  scheduledFor?: string | null;
}) {
  const caller = await requireAdmin();

  const generatedSlug = (formData.slug?.trim() || slugify(formData.title)) || `post-${Date.now()}`;
  const validData = announcementSchema.parse({
    ...formData,
    slug: generatedSlug,
    pinned: !!formData.pinned,
    status: formData.status || 'published',
  });

  // Ensure unique slug
  let uniqueSlug = validData.slug;
  let counter = 1;
  while (true) {
    const existing = await db.query.announcements.findFirst({
      where: eq(announcements.slug, uniqueSlug),
      columns: { id: true },
    });
    if (!existing) break;
    uniqueSlug = `${validData.slug}-${counter++}`;
  }

  const now = new Date();
  const isPublished = validData.status === 'published';
  const scheduledDate = validData.scheduledFor ? new Date(validData.scheduledFor) : null;

  return await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(announcements)
      .values({
        title: validData.title,
        slug: uniqueSlug,
        bodyMarkdown: validData.bodyMarkdown,
        category: validData.category,
        audience: validData.audience,
        channels: validData.channels,
        pinned: validData.pinned,
        status: validData.status,
        scheduledFor: scheduledDate,
        publishedAt: isPublished ? now : null,
        authorId: caller.user.id,
      })
      .returning();

    // If published and channels include email, enqueue emails to recipients
    if (isPublished && validData.channels.includes('email')) {
      let recipientUsers: Array<{ email: string; name: string | null }> = [];

      if (validData.audience === 'public') {
        recipientUsers = await tx
          .select({ email: users.email, name: users.name })
          .from(users)
          .where(eq(users.emailOptIn, true));
      } else {
        // Members only: active members with emailOptIn
        recipientUsers = await tx
          .select({ email: users.email, name: users.name })
          .from(users)
          .innerJoin(memberships, eq(users.id, memberships.userId))
          .where(
            and(
              eq(users.emailOptIn, true),
              eq(memberships.status, 'active'),
              lte(memberships.startsAt, now),
              gt(memberships.endsAt, now)
            )
          );
      }

      // Deduplicate emails
      const seen = new Set<string>();
      const uniqueRecipients = recipientUsers.filter((u) => {
        if (!u.email || seen.has(u.email)) return false;
        seen.add(u.email);
        return true;
      });

      if (uniqueRecipients.length > 0) {
        // Record delivery row
        await tx.insert(announcementDeliveries).values({
          announcementId: created.id,
          recipientsCount: uniqueRecipients.length,
          sentCount: 0,
          failedCount: 0,
          startedAt: now,
        });

        // Enqueue announcement emails
        for (const recipient of uniqueRecipients) {
          await enqueueEmail(
            {
              toEmail: recipient.email,
              subject: `[Skyline Announcement] ${created.title}`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #1e293b;">
                  <h2 style="color: #0f172a; margin-bottom: 8px;">${created.title}</h2>
                  <div style="font-size: 12px; color: #64748b; margin-bottom: 20px;">
                    Category: <strong>${created.category.toUpperCase()}</strong> • Published by Skyline Student Association
                  </div>
                  <div style="padding: 16px; background-color: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 4px; white-space: pre-wrap;">
                    ${created.bodyMarkdown}
                  </div>
                  <p style="margin-top: 24px; font-size: 13px; color: #64748b;">
                    You are receiving this because you subscribed to Skyline announcements. Manage your preferences on your profile.
                  </p>
                </div>
              `,
              text: `${created.title}\n\n${created.bodyMarkdown}`,
              kind: 'announcement',
              refType: 'announcement',
              refId: created.id,
            },
            tx
          );
        }
      }
    }

    // Write audit log
    await tx.insert(auditLog).values({
      actorId: caller.user.id,
      action: 'create_announcement',
      entityType: 'announcement',
      entityId: created.id,
      afterJson: {
        title: created.title,
        slug: created.slug,
        status: created.status,
        audience: created.audience,
        channels: created.channels,
      },
    });

    revalidatePath('/admin/announcements');
    revalidatePath('/announcements');
    revalidatePath('/');
    return { success: true, announcement: created };
  });
}

export async function updateAnnouncementAction(
  id: string,
  formData: {
    title: string;
    slug: string;
    bodyMarkdown: string;
    category: 'general' | 'meeting' | 'deadline' | 'event' | 'change_of_plan';
    audience: 'public' | 'members';
    channels: string[];
    pinned?: boolean;
    status?: 'draft' | 'scheduled' | 'published' | 'archived';
    scheduledFor?: string | null;
  }
) {
  const caller = await requireAdmin();

  const [existing] = await db
    .select()
    .from(announcements)
    .where(eq(announcements.id, id));

  if (!existing) {
    throw new Error('Announcement not found');
  }

  const validData = announcementSchema.parse({
    ...formData,
    pinned: !!formData.pinned,
    status: formData.status || existing.status,
  });

  const now = new Date();
  const willBePublished = validData.status === 'published';
  const wasPublished = existing.status === 'published';
  const shouldSetPublishedAt = willBePublished && !existing.publishedAt;
  const contentChanged =
    existing.title !== validData.title || existing.bodyMarkdown !== validData.bodyMarkdown;

  return await db.transaction(async (tx) => {
    // If already published and content changed, record a revision
    if (wasPublished && contentChanged) {
      await tx.insert(announcementRevisions).values({
        announcementId: id,
        title: existing.title,
        bodyMarkdown: existing.bodyMarkdown,
        editedBy: caller.user.id,
        editedAt: now,
      });
    }

    // Update announcement
    const [updated] = await tx
      .update(announcements)
      .set({
        title: validData.title,
        slug: validData.slug,
        bodyMarkdown: validData.bodyMarkdown,
        category: validData.category,
        audience: validData.audience,
        channels: validData.channels,
        pinned: validData.pinned,
        status: validData.status,
        scheduledFor: validData.scheduledFor ? new Date(validData.scheduledFor) : null,
        publishedAt: shouldSetPublishedAt ? now : existing.publishedAt,
        updatedAt: now,
      })
      .where(eq(announcements.id, id))
      .returning();

    // Check if email broadcast is requested and hasn't been delivered yet
    if (willBePublished && validData.channels.includes('email')) {
      const existingDelivery = await tx.query.announcementDeliveries.findFirst({
        where: eq(announcementDeliveries.announcementId, id),
      });

      if (!existingDelivery) {
        let recipientUsers: Array<{ email: string; name: string | null }> = [];

        if (validData.audience === 'public') {
          recipientUsers = await tx
            .select({ email: users.email, name: users.name })
            .from(users)
            .where(eq(users.emailOptIn, true));
        } else {
          recipientUsers = await tx
            .select({ email: users.email, name: users.name })
            .from(users)
            .innerJoin(memberships, eq(users.id, memberships.userId))
            .where(
              and(
                eq(users.emailOptIn, true),
                eq(memberships.status, 'active'),
                lte(memberships.startsAt, now),
                gt(memberships.endsAt, now)
              )
            );
        }

        const seen = new Set<string>();
        const uniqueRecipients = recipientUsers.filter((u) => {
          if (!u.email || seen.has(u.email)) return false;
          seen.add(u.email);
          return true;
        });

        if (uniqueRecipients.length > 0) {
          await tx.insert(announcementDeliveries).values({
            announcementId: updated.id,
            recipientsCount: uniqueRecipients.length,
            sentCount: 0,
            failedCount: 0,
            startedAt: now,
          });

          for (const recipient of uniqueRecipients) {
            await enqueueEmail(
              {
                toEmail: recipient.email,
                subject: `[Skyline Announcement] ${updated.title}`,
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #1e293b;">
                    <h2 style="color: #0f172a; margin-bottom: 8px;">${updated.title}</h2>
                    <div style="font-size: 12px; color: #64748b; margin-bottom: 20px;">
                      Category: <strong>${updated.category.toUpperCase()}</strong> • Published by Skyline Student Association
                    </div>
                    <div style="padding: 16px; background-color: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 4px; white-space: pre-wrap;">
                      ${updated.bodyMarkdown}
                    </div>
                  </div>
                `,
                text: `${updated.title}\n\n${updated.bodyMarkdown}`,
                kind: 'announcement',
                refType: 'announcement',
                refId: updated.id,
              },
              tx
            );
          }
        }
      }
    }

    // Write audit log
    await tx.insert(auditLog).values({
      actorId: caller.user.id,
      action: 'update_announcement',
      entityType: 'announcement',
      entityId: updated.id,
      beforeJson: {
        title: existing.title,
        status: existing.status,
        pinned: existing.pinned,
      },
      afterJson: {
        title: updated.title,
        status: updated.status,
        pinned: updated.pinned,
      },
    });

    revalidatePath('/admin/announcements');
    revalidatePath(`/admin/announcements/${id}`);
    revalidatePath('/announcements');
    revalidatePath(`/announcements/${updated.slug}`);
    revalidatePath('/');
    return { success: true, announcement: updated };
  });
}

export async function deleteAnnouncementAction(id: string) {
  const caller = await requireAdmin();

  const [existing] = await db
    .select()
    .from(announcements)
    .where(eq(announcements.id, id));

  if (!existing) {
    throw new Error('Announcement not found');
  }

  await db.transaction(async (tx) => {
    // Revisions and deliveries cascade delete due to schema definition
    await tx.delete(announcements).where(eq(announcements.id, id));

    await tx.insert(auditLog).values({
      actorId: caller.user.id,
      action: 'delete_announcement',
      entityType: 'announcement',
      entityId: id,
      beforeJson: {
        title: existing.title,
        slug: existing.slug,
        status: existing.status,
      },
    });
  });

  revalidatePath('/admin/announcements');
  revalidatePath('/announcements');
  revalidatePath('/');
  return { success: true, message: `Announcement "${existing.title}" deleted.` };
}

export async function togglePinAnnouncementAction(id: string) {
  const caller = await requireAdmin();

  const [existing] = await db
    .select()
    .from(announcements)
    .where(eq(announcements.id, id));

  if (!existing) {
    throw new Error('Announcement not found');
  }

  const newPinned = !existing.pinned;
  await db
    .update(announcements)
    .set({ pinned: newPinned, updatedAt: new Date() })
    .where(eq(announcements.id, id));

  await db.insert(auditLog).values({
    actorId: caller.user.id,
    action: newPinned ? 'pin_announcement' : 'unpin_announcement',
    entityType: 'announcement',
    entityId: id,
    beforeJson: { pinned: existing.pinned },
    afterJson: { pinned: newPinned },
  });

  revalidatePath('/admin/announcements');
  revalidatePath('/announcements');
  return { success: true, pinned: newPinned };
}

