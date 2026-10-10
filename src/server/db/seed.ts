import { db, pool } from '../db';
import { users, memberships, settings } from './schema';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Seeding demo accounts...');
  
  // 1. Settings
  await db.insert(settings).values([
    { key: 'membership_price_paise', valueJson: 50000 },
    { key: 'membership_duration_days', valueJson: 365 },
    { key: 'hold_minutes', valueJson: 15 },
    { key: 'low_stock_threshold', valueJson: 5 },
    { key: 'reminder_days', valueJson: 7 },
    { key: 'season_end_date', valueJson: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString() }
  ]).onConflictDoNothing();

  const now = new Date();
  
  // Define users
  const accounts = [
    { email: 'admin@skyline.test', name: 'Admin User', role: 'admin' as const, mem: { starts: -3, ends: 9, status: 'active' as const } },
    { email: 'member@skyline.test', name: 'Active Member', role: 'user' as const, mem: { starts: -1, ends: 11, status: 'active' as const } },
    { email: 'expiring@skyline.test', name: 'Expiring Member', role: 'user' as const, mem: { starts: -12, ends: 0.16, status: 'active' as const } }, // 5 days is ~0.16 months
    { email: 'lapsed@skyline.test', name: 'Lapsed Member', role: 'user' as const, mem: { starts: -13, ends: -1, status: 'active' as const } },
    { email: 'guest@skyline.test', name: 'Guest User', role: 'user' as const, mem: null },
  ];

  for (const acc of accounts) {
    const [user] = await db.insert(users).values({
      email: acc.email,
      name: acc.name,
      role: acc.role,
    }).onConflictDoUpdate({
      target: users.email,
      set: { role: acc.role, name: acc.name }
    }).returning();

    if (acc.mem) {
      const startsAt = new Date(now);
      startsAt.setMonth(now.getMonth() + acc.mem.starts);
      
      const endsAt = new Date(now);
      endsAt.setMonth(now.getMonth() + acc.mem.ends);

      await db.insert(memberships).values({
        userId: user.id,
        status: acc.mem.status,
        startsAt,
        endsAt,
        pricePaise: 50000,
        method: 'cash',
      }).onConflictDoNothing(); // For demo, we just ignore if they have one or we could be more rigorous
    }
  }

  console.log('Seed complete.');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

