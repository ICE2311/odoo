import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { fundraiserTasks, users, fundraisers } from '@/server/db/schema';
import { sql, eq, and, isNotNull, inArray, lt, gt } from 'drizzle-orm';
import { enqueueEmail } from '@/server/services/email';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowStart = new Date(tomorrow.setHours(0, 0, 0, 0));
  const tomorrowEnd = new Date(tomorrow.setHours(23, 59, 59, 999));

  // Find tasks due tomorrow that are not done
  const tasksDue = await db.select({
    taskId: fundraiserTasks.id,
    title: fundraiserTasks.title,
    assigneeName: users.name,
    assigneeEmail: users.email,
    fundraiserName: fundraisers.name,
  })
  .from(fundraiserTasks)
  .innerJoin(users, eq(fundraiserTasks.assigneeId, users.id))
  .innerJoin(fundraisers, eq(fundraiserTasks.fundraiserId, fundraisers.id))
  .where(
    and(
      isNotNull(fundraiserTasks.assigneeId),
      inArray(fundraiserTasks.status, ['todo', 'doing', 'blocked']),
      isNotNull(fundraiserTasks.dueAt),
      gt(fundraiserTasks.dueAt, tomorrowStart),
      lt(fundraiserTasks.dueAt, tomorrowEnd)
    )
  );

  let processed = 0;
  await db.transaction(async (tx) => {
    for (const task of tasksDue) {
      if (task.assigneeEmail) {
        await enqueueEmail({
          toEmail: task.assigneeEmail,
          subject: `Reminder: Task due tomorrow for ${task.fundraiserName}`,
          html: `<p>Hi ${task.assigneeName}, your task "<strong>${task.title}</strong>" is due tomorrow.</p>`,
          text: `Hi ${task.assigneeName}, your task "${task.title}" is due tomorrow.`,
          kind: 'transactional',
          refType: 'fundraiser_task',
          refId: task.taskId
        }, tx);
        processed++;
      }
    }
  });

  return NextResponse.json({ processed });
}

