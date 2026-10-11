'use server';

import { db } from '@/server/db';
import { fundraisers, fundraiserVolunteers, fundraiserTasks, fundraiserTakings, users, auditLog } from '@/server/db/schema';
import { requireAdmin, requireMember } from '@/server/auth/guards';
import { eq, and, sql } from 'drizzle-orm';
import { enqueueEmail } from '@/server/services/email';
import { recordEntry } from '@/server/services/ledger';
import { revalidatePath } from 'next/cache';

export async function createFundraiserAction(data: {
  name: string;
  slug: string;
  description: string;
  date: string;
  location: string;
  goalPaise: number;
  budgetPaise?: number;
}) {
  const caller = await requireAdmin();
  const [f] = await db
    .insert(fundraisers)
    .values({
      ...data,
      date: new Date(data.date),
      createdBy: caller.user.id,
    })
    .returning();
  revalidatePath('/admin/fundraisers');
  revalidatePath('/volunteer');
  return f.id;
}

export async function joinFundraiserAction(fundraiserId: string) {
  const caller = await requireMember();
  await db
    .insert(fundraiserVolunteers)
    .values({
      fundraiserId,
      userId: caller.user.id,
    })
    .onConflictDoNothing();
  revalidatePath('/volunteer');
  revalidatePath(`/volunteer/fundraisers/${fundraiserId}`);
  revalidatePath(`/admin/fundraisers/${fundraiserId}`);
  return { success: true };
}

export async function addFundraiserTaskAction(
  fundraiserId: string,
  data: {
    title: string;
    notes?: string;
    dueAt?: string | null;
    assigneeId?: string | null;
  }
) {
  const caller = await requireMember();

  // If not admin, ensure user is a volunteer (or auto-join them)
  if (!caller.isAdmin) {
    const joined = await db.query.fundraiserVolunteers.findFirst({
      where: and(
        eq(fundraiserVolunteers.fundraiserId, fundraiserId),
        eq(fundraiserVolunteers.userId, caller.user.id)
      ),
    });
    if (!joined) {
      await db
        .insert(fundraiserVolunteers)
        .values({
          fundraiserId,
          userId: caller.user.id,
        })
        .onConflictDoNothing();
    }
  }

  // Assign to selected user or leave null
  let assigneeId = data.assigneeId || null;
  if (assigneeId && !caller.isAdmin && assigneeId !== caller.user.id) {
    assigneeId = null;
  }

  const [newTask] = await db
    .insert(fundraiserTasks)
    .values({
      fundraiserId,
      title: data.title,
      notes: data.notes || null,
      dueAt: data.dueAt ? new Date(data.dueAt) : null,
      assigneeId,
      status: 'todo',
      createdBy: caller.user.id,
    })
    .returning();

  revalidatePath('/volunteer');
  revalidatePath(`/volunteer/fundraisers/${fundraiserId}`);
  revalidatePath(`/admin/fundraisers/${fundraiserId}`);

  return { success: true, task: newTask };
}

export async function claimTaskAction(taskId: string) {
  const caller = await requireMember();

  const [task] = await db.select().from(fundraiserTasks).where(eq(fundraiserTasks.id, taskId));
  if (!task) throw new Error('Task not found');
  if (task.assigneeId) throw new Error('Task already claimed');

  // ensure joined
  if (!caller.isAdmin) {
    const joined = await db.query.fundraiserVolunteers.findFirst({
      where: and(
        eq(fundraiserVolunteers.fundraiserId, task.fundraiserId),
        eq(fundraiserVolunteers.userId, caller.user.id)
      ),
    });
    if (!joined) {
      await db
        .insert(fundraiserVolunteers)
        .values({
          fundraiserId: task.fundraiserId,
          userId: caller.user.id,
        })
        .onConflictDoNothing();
    }
  }

  await db
    .update(fundraiserTasks)
    .set({ assigneeId: caller.user.id, updatedAt: new Date() })
    .where(eq(fundraiserTasks.id, taskId));

  revalidatePath('/volunteer');
  revalidatePath(`/volunteer/fundraisers/${task.fundraiserId}`);
  revalidatePath(`/admin/fundraisers/${task.fundraiserId}`);
  return { success: true };
}

export async function assignTaskAction(taskId: string, assigneeId: string) {
  const caller = await requireAdmin();
  const [task] = await db.select().from(fundraiserTasks).where(eq(fundraiserTasks.id, taskId));
  if (!task) throw new Error('Task not found');

  await db
    .update(fundraiserTasks)
    .set({ assigneeId, updatedAt: new Date() })
    .where(eq(fundraiserTasks.id, taskId));

  // ensure the assigned user is added to volunteers if not already
  await db
    .insert(fundraiserVolunteers)
    .values({
      fundraiserId: task.fundraiserId,
      userId: assigneeId,
    })
    .onConflictDoNothing();

  const [u] = await db.select().from(users).where(eq(users.id, assigneeId));
  if (u?.email) {
    const [f] = await db.select().from(fundraisers).where(eq(fundraisers.id, task.fundraiserId));
    await db.transaction(async (tx) => {
      await enqueueEmail(
        {
          toEmail: u.email,
          subject: `Task assigned: ${task.title}`,
          html: `<p>You have been assigned to the task "${task.title}" for ${f?.name || 'the fundraiser'}.</p>`,
          text: `You have been assigned to the task "${task.title}" for ${f?.name || 'the fundraiser'}.`,
          kind: 'transactional',
        },
        tx
      );
    });
  }

  revalidatePath('/volunteer');
  revalidatePath(`/volunteer/fundraisers/${task.fundraiserId}`);
  revalidatePath(`/admin/fundraisers/${task.fundraiserId}`);
  return { success: true };
}

export async function updateTaskStatusAction(
  taskId: string,
  status: 'todo' | 'doing' | 'done' | 'blocked'
) {
  const caller = await requireMember();
  const [task] = await db.select().from(fundraiserTasks).where(eq(fundraiserTasks.id, taskId));
  if (!task) throw new Error('Task not found');

  if (!caller.isAdmin && task.assigneeId !== caller.user.id) {
    throw new Error('Can only update your own tasks');
  }

  await db
    .update(fundraiserTasks)
    .set({ status, updatedAt: new Date() })
    .where(eq(fundraiserTasks.id, taskId));

  revalidatePath('/volunteer');
  revalidatePath(`/volunteer/fundraisers/${task.fundraiserId}`);
  revalidatePath(`/admin/fundraisers/${task.fundraiserId}`);
  return { success: true };
}

export async function deleteFundraiserTaskAction(taskId: string) {
  const caller = await requireMember();
  const [task] = await db.select().from(fundraiserTasks).where(eq(fundraiserTasks.id, taskId));
  if (!task) throw new Error('Task not found');

  if (!caller.isAdmin && task.createdBy !== caller.user.id) {
    throw new Error('Only the creator or an admin can delete this task');
  }

  await db.delete(fundraiserTasks).where(eq(fundraiserTasks.id, taskId));

  revalidatePath('/volunteer');
  revalidatePath(`/volunteer/fundraisers/${task.fundraiserId}`);
  revalidatePath(`/admin/fundraisers/${task.fundraiserId}`);
  return { success: true };
}

export async function recordTakingsAction(
  fundraiserId: string,
  amountPaise: number,
  method: 'cash' | 'upi_manual',
  note?: string
) {
  const caller = await requireMember();

  await db.transaction(async (tx) => {
    const [taking] = await tx
      .insert(fundraiserTakings)
      .values({
        fundraiserId,
        amountPaise,
        method,
        note,
        recordedBy: caller.user.id,
      })
      .returning();

    await recordEntry(tx, {
      direction: 'in',
      amountPaise,
      category: 'fundraiser_income',
      method,
      sourceType: 'fundraiser_takings',
      sourceId: taking.id,
      fundraiserId,
      description: note || `Takings recorded by ${method}`,
    });
  });

  revalidatePath('/admin/fundraisers');
  revalidatePath(`/admin/fundraisers/${fundraiserId}`);
  revalidatePath('/volunteer');
  revalidatePath(`/volunteer/fundraisers/${fundraiserId}`);
  return { success: true };
}

export async function updateFundraiserAction(
  fundraiserId: string,
  data: {
    name: string;
    description: string;
    date: string;
    location: string;
    goalPaise: number;
    budgetPaise?: number;
    status: 'planning' | 'active' | 'completed' | 'cancelled';
  }
) {
  const caller = await requireAdmin();

  const [existing] = await db.select().from(fundraisers).where(eq(fundraisers.id, fundraiserId));
  if (!existing) throw new Error('Fundraiser not found');

  const [updated] = await db
    .update(fundraisers)
    .set({
      name: data.name,
      description: data.description,
      date: new Date(data.date),
      location: data.location,
      goalPaise: data.goalPaise,
      budgetPaise: data.budgetPaise || null,
      status: data.status,
    })
    .where(eq(fundraisers.id, fundraiserId))
    .returning();

  await db.insert(auditLog).values({
    actorId: caller.user.id,
    action: 'update_fundraiser',
    entityType: 'fundraiser',
    entityId: fundraiserId,
    beforeJson: { name: existing.name, status: existing.status, goalPaise: existing.goalPaise },
    afterJson: { name: updated.name, status: updated.status, goalPaise: updated.goalPaise },
  });

  revalidatePath('/admin/fundraisers');
  revalidatePath(`/admin/fundraisers/${fundraiserId}`);
  revalidatePath('/volunteer');
  revalidatePath(`/volunteer/fundraisers/${fundraiserId}`);
  return { success: true, fundraiser: updated };
}

export async function deleteFundraiserAction(fundraiserId: string) {
  const caller = await requireAdmin();

  const [existing] = await db.select().from(fundraisers).where(eq(fundraisers.id, fundraiserId));
  if (!existing) throw new Error('Fundraiser not found');

  // Delete associated volunteers and tasks
  await db.delete(fundraiserVolunteers).where(eq(fundraiserVolunteers.fundraiserId, fundraiserId));
  await db.delete(fundraiserTasks).where(eq(fundraiserTasks.fundraiserId, fundraiserId));
  await db.delete(fundraisers).where(eq(fundraisers.id, fundraiserId));

  await db.insert(auditLog).values({
    actorId: caller.user.id,
    action: 'delete_fundraiser',
    entityType: 'fundraiser',
    entityId: fundraiserId,
    beforeJson: { name: existing.name, slug: existing.slug },
    afterJson: { name: null },
  });

  revalidatePath('/admin/fundraisers');
  revalidatePath('/volunteer');
  return { success: true, message: `Fundraiser "${existing.name}" was deleted.` };
}

