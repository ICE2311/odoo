import { desc, eq, ilike, or, gt, sql } from 'drizzle-orm';
import { z } from 'zod';
import { requireAdmin } from '@/server/auth/guards';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';

const ListUsersSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

export type ListUsersArgs = z.input<typeof ListUsersSchema>;

/**
 * Cursor-paginated user list for the admin panel.
 * Requires admin role. Returns only columns needed for display.
 */
export async function listUsers(args: ListUsersArgs) {
  await requireAdmin();

  const input = ListUsersSchema.parse(args);

  const rows = await db.query.users.findMany({
    where: (u, { and, gt: $gt, ilike: $ilike, or: $or }) => {
      const conditions = [];
      if (input.cursor) {
        conditions.push($gt(u.createdAt, new Date(input.cursor)));
      }
      if (input.search) {
        const like = `%${input.search}%`;
        conditions.push(
          $or($ilike(u.name, like), $ilike(u.email, like)),
        );
      }
      return conditions.length ? and(...conditions) : undefined;
    },
    orderBy: (u, { asc }) => [asc(u.createdAt)],
    limit: input.limit + 1,
    columns: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  const hasMore = rows.length > input.limit;
  const items = hasMore ? rows.slice(0, input.limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1]!.createdAt.toISOString() : null;

  return { items, nextCursor };
}

export async function getAdminUsersFull() {
  await requireAdmin();
  const now = new Date();

  const allUsers = await db.query.users.findMany({
    orderBy: (u, { desc }) => [desc(u.createdAt)],
  });

  const activeMemberships = await db.query.memberships.findMany({
    where: (m, { and, eq, lte, gt }) =>
      and(eq(m.status, 'active'), lte(m.startsAt, now), gt(m.endsAt, now)),
  });

  const allDoorStaff = await db.query.eventDoorStaff.findMany({
    where: (ds, { isNull }) => isNull(ds.revokedAt),
    with: {
      event: {
        columns: { id: true, title: true, startsAt: true, status: true },
      },
    },
  });

  const upcomingEvents = await db.query.events.findMany({
    where: (e, { ne }) => ne(e.status, 'cancelled'),
    orderBy: (e, { asc }) => [asc(e.startsAt)],
    columns: { id: true, title: true, startsAt: true, status: true },
  });

  return {
    users: allUsers.map((user) => {
      const activeMem = activeMemberships.find((m) => m.userId === user.id);
      const doorAssignments = allDoorStaff.filter((ds) => ds.userId === user.id);
      return {
        ...user,
        activeMembership: activeMem
          ? {
              id: activeMem.id,
              startsAt: activeMem.startsAt.toISOString(),
              endsAt: activeMem.endsAt.toISOString(),
            }
          : null,
        doorAssignments: doorAssignments.map((da) => ({
          id: da.id,
          eventId: da.eventId,
          eventTitle: da.event?.title || 'Event',
          startsAt: da.event?.startsAt?.toISOString() || null,
        })),
      };
    }),
    upcomingEvents: upcomingEvents.map((e) => ({
      id: e.id,
      title: e.title,
      startsAt: e.startsAt.toISOString(),
      status: e.status,
    })),
  };
}

