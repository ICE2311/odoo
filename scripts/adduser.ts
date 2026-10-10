import { db } from '../src/server/db';
import { users, memberships } from '../src/server/db/schema';
import { eq, and, lte, gt } from 'drizzle-orm';
import { calculateMembershipDates } from '../src/server/services/membership';

async function main() {
  const email = 'sush7392@gmail.com';
  console.log(`Checking user: ${email}...`);

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    console.error(`User with email ${email} not found.`);
    process.exit(1);
  }

  const now = new Date();

  // Check if active membership already exists
  const existingActive = await db.query.memberships.findFirst({
    where: and(
      eq(memberships.userId, user.id),
      eq(memberships.status, 'active'),
      lte(memberships.startsAt, now),
      gt(memberships.endsAt, now)
    ),
  });

  if (existingActive) {
    console.log(`User already has an active membership (id: ${existingActive.id}) ending on ${existingActive.endsAt.toISOString()}.`);
    process.exit(0);
  }

  const dates = await calculateMembershipDates(user.id, now);

  const [mem] = await db
    .insert(memberships)
    .values({
      userId: user.id,
      status: 'active',
      startsAt: dates.startsAt,
      endsAt: dates.endsAt,
      pricePaise: 50000,
      method: 'cash',
    })
    .returning();

  console.log(`Created active membership for ${email}:`);
  console.log(`- ID: ${mem.id}`);
  console.log(`- Status: ${mem.status}`);
  console.log(`- Starts: ${mem.startsAt.toISOString()}`);
  console.log(`- Ends: ${mem.endsAt.toISOString()}`);

  process.exit(0);
}

main().catch((err) => {
  console.error('Error adding membership:', err);
  process.exit(1);
});

