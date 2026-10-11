import { getCaller } from '@/server/auth/guards';
import { redirect } from 'next/navigation';
import { AccountShell } from '@/components/account-shell';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const caller = await getCaller();

  if (caller.kind !== 'user') {
    redirect('/login');
  }

  return (
    <AccountShell
      user={caller.user}
      isAdmin={caller.isAdmin}
      isTreasurer={caller.isTreasurer}
      isMember={caller.isMember}
    >
      {children}
    </AccountShell>
  );
}
