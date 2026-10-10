import { pool } from '../db';

async function main() {
  if (!process.env.DATABASE_URL_UNPOOLED?.includes('test')) {
    console.error('DANGER: reset-test.ts must only be run on the test branch!');
    process.exit(1);
  }
  
  const client = await pool.connect();
  try {
    await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    console.log('Test database reset successfully.');
  } finally {
    client.release();
  }
  process.exit(0);
}

main().catch(console.error);

