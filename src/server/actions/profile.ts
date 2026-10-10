'use server'

import { requireUser } from '@/server/auth/guards';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export async function updateProfile(data: any) {
  const caller = await requireUser();
  await db.update(users).set(data).where(eq(users.id, caller.user.id));
}
