import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Lazy initialization — avoids error during build when DATABASE_URL is not set
let _db: NeonHttpDatabase<typeof schema> | null = null;

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (!_db) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL environment variable is not set. ' +
        'Copy .env.example to .env.local and fill in your Neon PostgreSQL connection string.'
      );
    }
    const sql = neon(databaseUrl);
    _db = drizzle(sql, { schema });
  }
  return _db;
}

/** Convenience alias — lazy DB instance */
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

export type Database = NeonHttpDatabase<typeof schema>;
export { schema };
