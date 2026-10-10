'use server'
import { requireAdmin } from '@/server/auth/guards';
import { db } from '@/server/db';
import { users, auditLog } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export async function promoteUser(userId: string, role: 'admin' | 'user') {
  const caller = await requireAdmin();
  await db.update(users).set({ role }).where(eq(users.id, userId));
  await db.insert(auditLog).values({
    actorId: caller.user.id,
    action: 'update_role',
    entityType: 'user',
    entityId: userId,
    afterJson: { role }
  });
}
