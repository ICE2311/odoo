import { db } from '@/server/db';
import { fundraisers, fundraiserVolunteers, fundraiserTasks, fundraiserTakings, users } from '@/server/db/schema';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { enqueueEmail } from './email';
import { onMembershipLapsedHooks } from './membership';
import { recordEntry } from './ledger';

onMembershipLapsedHooks.push(async (userId, tx) => {
  // unassign open tasks
  const openTasks = await tx.select().from(fundraiserTasks).where(
    and(
      eq(fundraiserTasks.assigneeId, userId),
      inArray(fundraiserTasks.status, ['todo', 'doing', 'blocked'])
    )
  );

  if (openTasks.length > 0) {
    await tx.update(fundraiserTasks)
      .set({ assigneeId: null })
      .where(inArray(fundraiserTasks.id, openTasks.rows.map((t: any) => t.id)));
  }

  // remove from volunteers
  const joined = await tx.select().from(fundraiserVolunteers).where(eq(fundraiserVolunteers.userId, userId));
  
  if (joined.length > 0) {
    await tx.delete(fundraiserVolunteers).where(eq(fundraiserVolunteers.userId, userId));
    
    // notify admins
    const admins = await tx.select().from(users).where(eq(users.role, 'admin'));
    const userName = (await tx.select().from(users).where(eq(users.id, userId)))[0]?.name || 'A member';
    
    for (const admin of admins) {
      if (admin.email) {
        await enqueueEmail({
          toEmail: admin.email,
          subject: `Volunteer removed: ${userName}`,
          html: `<p>${userName}'s membership lapsed, and they were removed from their volunteer tasks and fundraisers.</p>`,
          text: `${userName}'s membership lapsed, and they were removed from their volunteer tasks and fundraisers.`,
          kind: 'transactional',
        }, tx);
      }
    }
  }
});

