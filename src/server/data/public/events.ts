import { db } from '@/server/db';
import { events } from '@/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

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

export async function getPublicEventBySlug(slug: string) {
  const event = await db.query.events.findFirst({
    where: and(
      eq(events.slug, slug),
      eq(events.status, 'published')
    ),
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
    }
  });

  return event;
}

