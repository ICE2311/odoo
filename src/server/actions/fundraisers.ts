'use server';

import { db } from '@/server/db';
import { fundraisers, fundraiserVolunteers, fundraiserTasks, fundraiserTakings, users } from '@/server/db/schema';
import { requireAdmin, requireMember } from '@/server/auth/guards';
import { eq, and, sql } from 'drizzle-orm';
import { enqueueEmail } from '@/server/services/email';
import { recordEntry } from '@/server/services/ledger';
import { revalidatePath } from 'next/cache';

export async function createFundraiserAction(data: { name: string, slug: string, description: string, date: string, location: string, goalPaise: number, budgetPaise?: number }) {
  const caller = await requireAdmin();
  const [f] = await db.insert(fundraisers).values({
    ...data,
    date: new Date(data.date),
    createdBy: caller.user.id
  }).returning();
  revalidatePath('/admin/fundraisers');
  return f.id;
}

export async function joinFundraiserAction(fundraiserId: string) {
  const caller = await requireMember();
  await db.insert(fundraiserVolunteers).values({
    fundraiserId,
    userId: caller.user.id
  }).onConflictDoNothing();
  revalidatePath('/volunteer');
  revalidatePath(`/volunteer/fundraisers/${fundraiserId}`);
  revalidatePath(`/admin/fundraisers/${fundraiserId}`);
}

export async function addFundraiserTaskAction(fundraiserId: string, data: { title: string, notes?: string, dueAt?: string }) {
  const caller = await requireMember();
  // if not admin, ensure they are a volunteer
  if (!caller.isAdmin) {
    const joined = await db.query.fundraiserVolunteers.findFirst({
      where: and(eq(fundraiserVolunteers.fundraiserId, fundraiserId), eq(fundraiserVolunteers.userId, caller.user.id))
    });
    if (!joined) throw new Error('Must join fundraiser to add tasks');
  }

  await db.insert(fundraiserTasks).values({
    fundraiserId,
    title: data.title,
    notes: data.notes,
    dueAt: data.dueAt ? new Date(data.dueAt) : null,
    createdBy: caller.user.id
  });
  revalidatePath(`/volunteer/fundraisers/${fundraiserId}`);
  revalidatePath(`/admin/fundraisers/${fundraiserId}`);
}

export async function claimTaskAction(taskId: string) {
  const caller = await requireMember();
  
  const [task] = await db.select().from(fundraiserTasks).where(eq(fundraiserTasks.id, taskId));
  if (!task) throw new Error('Task not found');
  if (task.assigneeId) throw new Error('Task already claimed');

  // ensure joined
  if (!caller.isAdmin) {
    const joined = await db.query.fundraiserVolunteers.findFirst({
      where: and(eq(fundraiserVolunteers.fundraiserId, task.fundraiserId), eq(fundraiserVolunteers.userId, caller.user.id))
    });
    if (!joined) throw new Error('Must join fundraiser to claim task');
  }

  await db.update(fundraiserTasks)
    .set({ assigneeId: caller.user.id })
    .where(eq(fundraiserTasks.id, taskId));

  revalidatePath(`/volunteer/fundraisers/${task.fundraiserId}`);
  revalidatePath(`/admin/fundraisers/${task.fundraiserId}`);
}

export async function assignTaskAction(taskId: string, assigneeId: string) {
  const caller = await requireAdmin();
  const [task] = await db.select().from(fundraiserTasks).where(eq(fundraiserTasks.id, taskId));
  if (!task) throw new Error('Task not found');

  await db.update(fundraiserTasks)
    .set({ assigneeId })
    .where(eq(fundraiserTasks.id, taskId));

  // ensure the assigned user is added to volunteers if not already
  await db.insert(fundraiserVolunteers).values({
    fundraiserId: task.fundraiserId,
    userId: assigneeId
  }).onConflictDoNothing();

  const [u] = await db.select().from(users).where(eq(users.id, assigneeId));
  if (u?.email) {
    const [f] = await db.select().from(fundraisers).where(eq(fundraisers.id, task.fundraiserId));
    await db.transaction(async (tx) => {
      await enqueueEmail({
        toEmail: u.email,
        subject: `Task assigned: ${task.title}`,
        html: `<p>You have been assigned to the task "${task.title}" for ${f.name}.</p>`,
        text: `You have been assigned to the task "${task.title}" for ${f.name}.`,
        kind: 'transactional',
      }, tx);
    });
  }

  revalidatePath(`/volunteer/fundraisers/${task.fundraiserId}`);
  revalidatePath(`/admin/fundraisers/${task.fundraiserId}`);
}

export async function updateTaskStatusAction(taskId: string, status: 'todo' | 'doing' | 'done' | 'blocked') {
  const caller = await requireMember();
  const [task] = await db.select().from(fundraiserTasks).where(eq(fundraiserTasks.id, taskId));
  if (!task) throw new Error('Task not found');
  
  if (!caller.isAdmin && task.assigneeId !== caller.user.id) {
    throw new Error('Can only update your own tasks');
  }

  await db.update(fundraiserTasks).set({ status }).where(eq(fundraiserTasks.id, taskId));

  revalidatePath(`/volunteer/fundraisers/${task.fundraiserId}`);
  revalidatePath(`/admin/fundraisers/${task.fundraiserId}`);
}

export async function recordTakingsAction(fundraiserId: string, amountPaise: number, method: 'cash' | 'upi_manual', note?: string) {
  const caller = await requireAdmin();
  
  await db.transaction(async (tx) => {
    const [taking] = await tx.insert(fundraiserTakings).values({
      fundraiserId,
      amountPaise,
      method,
      note,
      recordedBy: caller.user.id
    }).returning();

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

  revalidatePath(`/admin/fundraisers/${fundraiserId}`);
  revalidatePath(`/volunteer/fundraisers/${fundraiserId}`);
}

