import { db } from '@/server/db';
import { events } from '@/server/db/schema';
import { eq, and, or, desc } from 'drizzle-orm';
import { getCaller } from '@/server/auth/guards';

/**
 * Returns all published events visible to the current caller.
 * Members-only events are only returned if the caller is an active member or admin.
 */
export async function getPublicEvents() {
  const caller = await getCaller();
  const canSeeMembersOnly = caller.kind === 'user' && (caller.isMember || caller.isAdmin);

  const whereCondition = canSeeMembersOnly
    ? eq(events.status, 'published')
    : and(eq(events.status, 'published'), eq(events.membersOnly, false));

  const list = await db.query.events.findMany({
    where: whereCondition,
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
      membersOnly: true,
    },
  });

  return list;
}

/**
 * Returns an event by slug or UUID.
 */
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
      membersOnly: true,
      status: true,
    },
  });

  return event;
}
