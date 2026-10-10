import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from './db/schema';

neonConfig.webSocketConstructor = ws;

// Singleton pool — never open a new pool per query
const globalForDb = globalThis as unknown as { pool: Pool | undefined };
if (!globalForDb.pool) {
  globalForDb.pool = new Pool({ connectionString: process.env.DATABASE_URL! });
}
export const pool = globalForDb.pool;
export const db = drizzle(pool, { schema });

