import { db } from '@/server/db';
import { fundraisers, fundraiserVolunteers, fundraiserTasks, fundraiserTakings, users } from '@/server/db/schema';
import { eq, and, sql, desc, sum, count } from 'drizzle-orm';
import { requireMember, requireAdmin } from '@/server/auth/guards';
import { computeOnTrackStatus } from './fundraisers/utils';

export async function getActiveFundraisers() {
  const caller = await requireMember();
  
  const rows = await db.execute(sql`
    SELECT f.id, f.name, f.date, f.location, f.goal_paise, f.status,
           COALESCE((SELECT SUM(amount_paise) FROM fundraiser_takings WHERE fundraiser_id = f.id), 0) as raised_paise,
           EXISTS(SELECT 1 FROM fundraiser_volunteers v WHERE v.fundraiser_id = f.id AND v.user_id = ${caller.user.id}) as is_joined
    FROM fundraisers f
    WHERE f.status IN ('planning', 'active')
    ORDER BY f.date ASC
  `);

  return rows.rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    date: new Date(r.date),
    location: r.location,
    goalPaise: Number(r.goal_paise),
    raisedPaise: Number(r.raised_paise),
    status: r.status,
    isJoined: r.is_joined
  }));
}

export async function getMyTasks() {
  const caller = await requireMember();

  const rows = await db.select({
    id: fundraiserTasks.id,
    title: fundraiserTasks.title,
    dueAt: fundraiserTasks.dueAt,
    status: fundraiserTasks.status,
    fundraiserId: fundraisers.id,
    fundraiserName: fundraisers.name,
  })
  .from(fundraiserTasks)
  .innerJoin(fundraisers, eq(fundraiserTasks.fundraiserId, fundraisers.id))
  .where(
    and(
      eq(fundraiserTasks.assigneeId, caller.user.id),
      sql`${fundraiserTasks.status} != 'done'`
    )
  )
  .orderBy(fundraiserTasks.dueAt);

  return rows;
}

export async function getFundraiserBoard(id: string) {
  const caller = await requireMember();

  // ensure joined or admin
  if (!caller.isAdmin) {
    const joined = await db.query.fundraiserVolunteers.findFirst({
      where: and(eq(fundraiserVolunteers.fundraiserId, id), eq(fundraiserVolunteers.userId, caller.user.id))
    });
    if (!joined) throw new Error('Not joined');
  }

  const f = await db.query.fundraisers.findFirst({
    where: eq(fundraisers.id, id)
  });
  if (!f) throw new Error('Not found');

  const raisedRes = await db.execute(sql`SELECT SUM(amount_paise) as raised FROM fundraiser_takings WHERE fundraiser_id = ${id}`);
  const raisedPaise = Number(raisedRes.rows[0]?.raised || 0);

  const expensesRes = await db.execute(sql`SELECT SUM(amount_paise) as expenses FROM ledger_entries WHERE fundraiser_id = ${id} AND category = 'expense_reimbursement'`);
  const costsPaise = Number(expensesRes.rows[0]?.expenses || 0);
  const profitPaise = raisedPaise - costsPaise;

  const tasks = await db.execute(sql`
    SELECT t.id, t.title, t.notes, t.status, t.due_at, t.assignee_id, u.name as assignee_name, u.image as assignee_image
    FROM fundraiser_tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE t.fundraiser_id = ${id}
  `);

  const taskList = tasks.rows.map((r: any) => ({
    id: r.id,
    title: r.title,
    notes: r.notes,
    status: r.status,
    dueAt: r.due_at ? new Date(r.due_at) : null,
    assigneeId: r.assignee_id,
    assigneeName: r.assignee_name,
    assigneeImage: r.assignee_image,
  }));

  const now = new Date();
  const tasksTotal = taskList.length;
  const tasksDone = taskList.filter((t) => t.status === 'done').length;
  const hasOverdueTasks = taskList.some((t) => t.status !== 'done' && t.dueAt && t.dueAt < now);

  const onTrack = computeOnTrackStatus(f.date, f.goalPaise, raisedPaise, tasksTotal, tasksDone, hasOverdueTasks, now);

  let volunteers: any[] = [];
  if (caller.isAdmin) {
    const vRes = await db.execute(sql`
      SELECT u.id, u.name, u.email, v.joined_at 
      FROM fundraiser_volunteers v 
      JOIN users u ON v.user_id = u.id 
      WHERE v.fundraiser_id = ${id}
    `);
    volunteers = vRes.rows.map((r: any) => ({
      id: r.id, name: r.name, email: r.email, joinedAt: new Date(r.joined_at)
    }));
  }

  return {
    fundraiser: {
      ...f,
      raisedPaise,
      costsPaise,
      profitPaise,
      tasksTotal,
      tasksDone,
      onTrack,
      daysLeft: Math.floor((f.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    },
    tasks: taskList,
    volunteers
  };
}

export async function getAdminFundraisers() {
  const caller = await requireAdmin();

  const rows = await db.execute(sql`
    SELECT f.id, f.name, f.date, f.status, f.goal_paise,
           COALESCE((SELECT SUM(amount_paise) FROM fundraiser_takings WHERE fundraiser_id = f.id), 0) as raised_paise,
           (SELECT COUNT(*) FROM fundraiser_tasks WHERE fundraiser_id = f.id) as tasks_total,
           (SELECT COUNT(*) FROM fundraiser_tasks WHERE fundraiser_id = f.id AND status = 'done') as tasks_done,
           EXISTS(SELECT 1 FROM fundraiser_tasks WHERE fundraiser_id = f.id AND status != 'done' AND due_at < NOW()) as has_overdue
    FROM fundraisers f
    ORDER BY f.date DESC
  `);

  return rows.rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    date: new Date(r.date),
    status: r.status,
    goalPaise: Number(r.goal_paise),
    raisedPaise: Number(r.raised_paise),
    onTrack: computeOnTrackStatus(new Date(r.date), Number(r.goal_paise), Number(r.raised_paise), Number(r.tasks_total), Number(r.tasks_done), Boolean(r.has_overdue)),
  }));
}

