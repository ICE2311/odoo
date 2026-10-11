'use server';

import { requireAdmin } from '@/server/auth/guards';
import { db } from '@/server/db';
import { users, auditLog, memberships, eventDoorStaff, events } from '@/server/db/schema';
import { eq, and, sql, count } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const userEditSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Invalid email address'),
  phone: z.string().trim().max(20).optional().nullable(),
  studentId: z.string().trim().max(50).optional().nullable(),
  college: z.string().trim().max(100).optional().nullable(),
  emailOptIn: z.boolean().default(true),
  role: z.enum(['user', 'admin', 'treasurer']).default('user'),
});

export async function promoteUser(userId: string, role: 'admin' | 'treasurer' | 'user') {
  const caller = await requireAdmin();

  const [targetUser] = await db.select().from(users).where(eq(users.id, userId));
  if (!targetUser) throw new Error('User not found');

  if (targetUser.role === 'admin' && role !== 'admin') {
    const adminCountRes = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, 'admin'));
    const adminCount = Number(adminCountRes[0]?.count || 0);
    if (adminCount <= 1) {
      throw new Error('Cannot demote the last remaining admin');
    }
  }

  await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId));

  await db.insert(auditLog).values({
    actorId: caller.user.id,
    action: 'update_role',
    entityType: 'user',
    entityId: userId,
    beforeJson: { role: targetUser.role },
    afterJson: { role },
  });

  revalidatePath('/admin/users');
  return { success: true };
}

export async function updateUserDetails(
  userId: string,
  input: {
    name: string;
    email: string;
    phone?: string | null;
    studentId?: string | null;
    college?: string | null;
    emailOptIn?: boolean;
    role?: 'admin' | 'treasurer' | 'user';
  }
) {
  const caller = await requireAdmin();
  const validated = userEditSchema.parse(input);

  const [existingUser] = await db.select().from(users).where(eq(users.id, userId));
  if (!existingUser) throw new Error('User not found');

  if (existingUser.role === 'admin' && validated.role !== 'admin') {
    const adminCountRes = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, 'admin'));
    const adminCount = Number(adminCountRes[0]?.count || 0);
    if (adminCount <= 1) {
      throw new Error('Cannot demote the last remaining admin');
    }
  }

  // Check email uniqueness if email changed
  if (validated.email.toLowerCase() !== existingUser.email.toLowerCase()) {
    const [emailConflict] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, validated.email.toLowerCase()));
    if (emailConflict && emailConflict.id !== userId) {
      throw new Error('A user with this email already exists');
    }
  }

  await db
    .update(users)
    .set({
      name: validated.name,
      email: validated.email.toLowerCase(),
      phone: validated.phone || null,
      studentId: validated.studentId || null,
      college: validated.college || null,
      emailOptIn: validated.emailOptIn,
      role: validated.role,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  await db.insert(auditLog).values({
    actorId: caller.user.id,
    action: 'update_user_profile',
    entityType: 'user',
    entityId: userId,
    beforeJson: {
      name: existingUser.name,
      email: existingUser.email,
      phone: existingUser.phone,
      studentId: existingUser.studentId,
      college: existingUser.college,
      role: existingUser.role,
      emailOptIn: existingUser.emailOptIn,
    },
    afterJson: validated,
  });

  revalidatePath('/admin/users');
  return { success: true };
}

export async function grantManualMembership(userId: string, durationDays = 365) {
  const caller = await requireAdmin();
  const startsAt = new Date();
  const endsAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  const [newMembership] = await db
    .insert(memberships)
    .values({
      userId,
      status: 'active',
      startsAt,
      endsAt,
      pricePaise: 0,
      method: 'admin_grant',
      recordedBy: caller.user.id,
    })
    .returning();

  await db.insert(auditLog).values({
    actorId: caller.user.id,
    action: 'grant_membership',
    entityType: 'membership',
    entityId: newMembership.id,
    afterJson: { userId, durationDays, endsAt: endsAt.toISOString() },
  });

  revalidatePath('/admin/users');
  return { success: true, endsAt };
}

export async function assignDoorStaffRole(userId: string, eventId: string) {
  const caller = await requireAdmin();

  // Check if there is an existing record (even revoked)
  const [existing] = await db
    .select()
    .from(eventDoorStaff)
    .where(and(eq(eventDoorStaff.eventId, eventId), eq(eventDoorStaff.userId, userId)));

  let staffId: string;
  if (existing) {
    await db
      .update(eventDoorStaff)
      .set({
        revokedAt: null,
        grantedBy: caller.user.id,
        grantedAt: new Date(),
      })
      .where(eq(eventDoorStaff.id, existing.id));
    staffId = existing.id;
  } else {
    const [inserted] = await db
      .insert(eventDoorStaff)
      .values({
        eventId,
        userId,
        grantedBy: caller.user.id,
      })
      .returning();
    staffId = inserted.id;
  }

  await db.insert(auditLog).values({
    actorId: caller.user.id,
    action: 'assign_door_staff',
    entityType: 'event_door_staff',
    entityId: staffId,
    afterJson: { eventId, userId, grantedBy: caller.user.id },
  });

  revalidatePath('/admin/users');
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/admin/events/${eventId}/door-staff`);
  return { success: true, staffId };
}

export async function revokeDoorStaffRole(staffId: string) {
  const caller = await requireAdmin();

  const [updated] = await db
    .update(eventDoorStaff)
    .set({ revokedAt: new Date() })
    .where(eq(eventDoorStaff.id, staffId))
    .returning();

  if (updated) {
    await db.insert(auditLog).values({
      actorId: caller.user.id,
      action: 'revoke_door_staff',
      entityType: 'event_door_staff',
      entityId: staffId,
      afterJson: { revokedAt: updated.revokedAt },
    });
    revalidatePath('/admin/users');
    revalidatePath(`/admin/events/${updated.eventId}`);
    revalidatePath(`/admin/events/${updated.eventId}/door-staff`);
  }

  return { success: true };
}

export async function deleteUserAction(userId: string) {
  const caller = await requireAdmin();

  if (caller.user.id === userId) {
    throw new Error('You cannot delete your own admin account');
  }

  const [targetUser] = await db.select().from(users).where(eq(users.id, userId));
  if (!targetUser) throw new Error('User not found');

  if (targetUser.role === 'admin') {
    const adminCountRes = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, 'admin'));
    const adminCount = Number(adminCountRes[0]?.count || 0);
    if (adminCount <= 1) {
      throw new Error('Cannot delete the last remaining admin');
    }
  }

  // Remove door staff assignments, memberships and the user
  await db.delete(eventDoorStaff).where(eq(eventDoorStaff.userId, userId));
  await db.delete(memberships).where(eq(memberships.userId, userId));
  await db.delete(users).where(eq(users.id, userId));

  await db.insert(auditLog).values({
    actorId: caller.user.id,
    action: 'delete_user',
    entityType: 'user',
    entityId: userId,
    beforeJson: { name: targetUser.name, email: targetUser.email, role: targetUser.role },
  });

  revalidatePath('/admin/users');
  return { success: true, message: `User "${targetUser.name || targetUser.email}" was deleted.` };
}

