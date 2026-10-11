import { getCaller } from '@/server/auth/guards';
import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin-shell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const caller = await getCaller();
  if (caller.kind !== 'user' || (caller.user.role !== 'admin' && caller.user.role !== 'treasurer')) {
    redirect('/');
  }

  return (
    <AdminShell user={caller.user}>
      {children}
    </AdminShell>
  );
}
