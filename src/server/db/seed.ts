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
    { key: 'season_end_month_day', valueJson: '05-31' },
    { key: 'renewal_window_days', valueJson: 30 }
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

  console.log('Seeding Phase 4 Events...');
  const { events } = await import('./schema');
  
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const openDate = new Date();
  openDate.setDate(openDate.getDate() - 1);
  const closeDate = new Date(nextMonth);
  closeDate.setDate(closeDate.getDate() - 1);

  await db.insert(events).values([
    {
      title: 'Spring Gala',
      slug: 'spring-gala',
      description: 'The biggest event of the year!',
      venue: 'Main Hall',
      startsAt: nextMonth,
      endsAt: new Date(nextMonth.getTime() + 4 * 60 * 60 * 1000),
      capacity: 300,
      memberPricePaise: 20000, // ₹200
      nonMemberPricePaise: 50000, // ₹500
      salesOpenAt: openDate,
      salesCloseAt: closeDate,
      status: 'published',
    }
  ]).onConflictDoNothing();

  console.log('Seed complete.');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

