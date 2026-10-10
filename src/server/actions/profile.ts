'use server';

import { requireUser } from '@/server/auth/guards';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const profileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  phone: z.string().trim().max(30).optional().nullable(),
  studentId: z.string().trim().max(50).optional().nullable(),
  college: z.string().trim().max(100).optional().nullable(),
  emailOptIn: z.boolean(),
});

export async function updateProfileAction(data: z.infer<typeof profileSchema>) {
  const caller = await requireUser();
  const parsed = profileSchema.parse(data);

  await db
    .update(users)
    .set({
      name: parsed.name,
      phone: parsed.phone || null,
      studentId: parsed.studentId || null,
      college: parsed.college || null,
      emailOptIn: parsed.emailOptIn,
      updatedAt: new Date(),
    })
    .where(eq(users.id, caller.user.id));

  revalidatePath('/account/profile');
  return { success: true };
}

export async function updateProfile(data: any) {
  const caller = await requireUser();
  await db.update(users).set(data).where(eq(users.id, caller.user.id));
  revalidatePath('/account/profile');
}
