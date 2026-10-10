'use server';

import { cookies } from 'next/headers';
import { requireUser } from '@/server/auth/guards';
import { db } from '@/server/db';
import { accounts, users } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Prepares the session cookie to link an authenticated Google account
 * to the currently logged in user upon OAuth callback.
 */
export async function prepareGoogleLinkAction() {
  const caller = await requireUser();
  const cookieStore = await cookies();

  cookieStore.set('skyline_link_user_id', caller.user.id, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
  });

  return { success: true };
}

/**
 * Unlinks the Google OAuth account from the currently logged in user.
 */
export async function unlinkGoogleAction() {
  const caller = await requireUser();

  const user = await db.query.users.findFirst({
    where: eq(users.id, caller.user.id),
    columns: { passwordHash: true, email: true },
  });

  // Verify the user has a Google account linked
  const googleAccount = await db.query.accounts.findFirst({
    where: and(
      eq(accounts.userId, caller.user.id),
      eq(accounts.provider, 'google')
    ),
  });

  if (!googleAccount) {
    throw new Error('No Google account is currently linked.');
  }

  // Remove the Google account link
  await db.delete(accounts).where(
    and(
      eq(accounts.userId, caller.user.id),
      eq(accounts.provider, 'google')
    )
  );

  revalidatePath('/account/profile');
  return { success: true };
}

