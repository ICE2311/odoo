import { db, pool } from '../db';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';

async function main() {
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle/migrations' });
  console.log('Migrations applied successfully!');
  await pool.end();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('Migration failed:', err);
  try {
    await pool.end();
  } catch {}
  process.exit(1);
});

