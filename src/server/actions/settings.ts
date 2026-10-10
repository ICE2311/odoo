'use server'
import { requireAdmin } from '@/server/auth/guards';
import { db } from '@/server/db';
import { settings, auditLog } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export async function updateSettings(key: string, value: any) {
  const caller = await requireAdmin();
  await db.update(settings).set({ valueJson: value, updatedBy: caller.user.id }).where(eq(settings.key, key));
}
