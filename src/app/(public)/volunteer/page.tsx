import { requireMember } from '@/server/auth/guards';
import { getActiveFundraisers, getMyTasks } from '@/server/data/fundraisers';
import { VolunteerClient } from './volunteer-client';

export default async function VolunteerPage() {
  const caller = await requireMember();
  const fundraisers = await getActiveFundraisers();
  const myTasks = await getMyTasks();

  const formattedFundraisers = fundraisers.map((f: any) => ({
    id: f.id,
    name: f.name,
    date: new Date(f.date).toISOString(),
    location: f.location || '',
    goalPaise: f.goalPaise,
    raisedPaise: f.raisedPaise,
    status: f.status,
    isJoined: !!f.isJoined,
  }));

  const formattedTasks = myTasks.map((t: any) => ({
    id: t.id,
    title: t.title,
    dueAt: t.dueAt ? new Date(t.dueAt).toISOString() : null,
    status: t.status,
    fundraiserId: t.fundraiserId,
    fundraiserName: t.fundraiserName,
  }));

  return (
    <VolunteerClient
      initialFundraisers={formattedFundraisers}
      initialMyTasks={formattedTasks}
      currentUserId={caller.user.id}
    />
  );
}
