import { db } from '../src/server/db';
import { users } from '../src/server/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const email = 'icyzoid@gmail.com';
  console.log(`Checking user with email: ${email}...`);

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existing) {
    await db.update(users).set({ role: 'admin' }).where(eq(users.email, email));
    console.log(`User ${email} found (id: ${existing.id}). Updated role to 'admin'.`);
  } else {
    const [created] = await db
      .insert(users)
      .values({
        email,
        name: 'Admin',
        role: 'admin',
      })
      .returning();
    console.log(`User ${email} did not exist. Created new user (id: ${created.id}) with role: 'admin'.`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

