import { requireAdmin } from '@/server/auth/guards';
import { getAdminUsersFull } from '@/server/data/admin/users';
import { UsersClient } from './users-client';

export default async function AdminUsersPage() {
  await requireAdmin();
  const { users, upcomingEvents } = await getAdminUsersFull();

  return <UsersClient initialUsers={users} upcomingEvents={upcomingEvents} />;
}
