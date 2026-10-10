import { db } from '@/server/db';
import { events } from '@/server/db/schema';
import { eq, and, or, desc } from 'drizzle-orm';
import { getCaller } from '@/server/auth/guards';

export async function getPublicEvents() {
  const list = await db.query.events.findMany({
    where: eq(events.status, 'published'),
    orderBy: [desc(events.startsAt)],
    columns: {
      id: true,
      title: true,
      slug: true,
      description: true,
      bannerUrl: true,
      venue: true,
      startsAt: true,
      endsAt: true,
      capacity: true,
      memberPricePaise: true,
      nonMemberPricePaise: true,
      salesOpenAt: true,
      salesCloseAt: true,
      seatsSold: true,
      seatsHeld: true,
    },
  });

  return list;
}

export async function getPublicEventBySlug(slugOrId: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
  const caller = await getCaller();
  const isAdmin = caller.kind === 'user' && caller.isAdmin;

  const matchCondition = isUuid
    ? or(eq(events.id, slugOrId), eq(events.slug, slugOrId))
    : eq(events.slug, slugOrId);

  const event = await db.query.events.findFirst({
    where: isAdmin ? matchCondition : and(matchCondition, eq(events.status, 'published')),
    columns: {
      id: true,
      title: true,
      slug: true,
      description: true,
      bannerUrl: true,
      venue: true,
      startsAt: true,
      endsAt: true,
      capacity: true,
      memberPricePaise: true,
      nonMemberPricePaise: true,
      salesOpenAt: true,
      salesCloseAt: true,
      maxTicketsPerUser: true,
      seatsSold: true,
      seatsHeld: true,
      status: true,
    },
  });

  return event;
}
