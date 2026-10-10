import { getMyProfile } from '@/server/data/me/profile';
import { getCaller } from '@/server/auth/guards';
import { ProfileForm } from './profile-form';

export default async function ProfilePage() {
  const caller = await getCaller();
  if (caller.kind !== 'user') return null;

  const profile = await getMyProfile();

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      <div className="flex justify-between items-end border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            My Profile & Preferences
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your personal student details and email announcement preferences.
          </p>
        </div>
      </div>

      <ProfileForm profile={profile} role={caller.user.role} />
    </div>
  );
}
