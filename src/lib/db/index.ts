import path from 'node:path';
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { Pool } from 'pg';
import { drizzle as drizzleNodePg, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { env } from '@/lib/env';
import * as schema from './schema';

/**
 * Two drivers, one PostgreSQL dialect.
 *
 * - `postgres` (required in production) talks to a real PostgreSQL server.
 * - `pglite` runs the actual PostgreSQL engine compiled to WASM against a local
 *   directory. It exists so the project can be cloned and run with zero
 *   infrastructure while still executing genuine PostgreSQL SQL — the same
 *   migrations, constraints and transactions used in production.
 */
export type Database = NodePgDatabase<typeof schema>;

type GlobalCache = {
  db?: Database;
  migrated?: Promise<void>;
};

const globalCache = globalThis as unknown as { __patienceDb?: GlobalCache };
const cache: GlobalCache = (globalCache.__patienceDb ??= {});

function createDatabase(): Database {
  if (env.database.driver === 'postgres') {
    const pool = new Pool({
      connectionString: env.database.url,
      max: 10,
      idleTimeoutMillis: 30_000,
      ssl:
        env.isProduction && !env.database.url.includes('sslmode=disable')
          ? { rejectUnauthorized: false }
          : undefined,
    });
    return drizzleNodePg(pool, { schema });
  }

  const dir = path.resolve(process.cwd(), env.database.pgliteDir);
  fs.mkdirSync(dir, { recursive: true });
  const client = new PGlite(dir);
  return drizzlePglite(client, { schema }) as unknown as Database;
}

export const db: Database = (cache.db ??= createDatabase());

/**
 * Applies pending migrations. Called explicitly by `npm run db:migrate`, and
 * lazily on the first query in development so a fresh clone just works.
 */
export async function runMigrations(): Promise<void> {
  const migrationsFolder = path.resolve(process.cwd(), 'drizzle');
  if (!fs.existsSync(migrationsFolder)) {
    throw new Error('No `drizzle/` migrations folder found. Run `npm run db:generate` first.');
  }

  if (env.database.driver === 'postgres') {
    const { migrate } = await import('drizzle-orm/node-postgres/migrator');
    await migrate(db as NodePgDatabase<typeof schema>, { migrationsFolder });
    return;
  }

  const { migrate } = await import('drizzle-orm/pglite/migrator');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await migrate(db as any, { migrationsFolder });
}

/** Dev-only convenience so the embedded database is always up to date. */
export function ensureMigrated(): Promise<void> {
  if (env.isProduction || env.database.driver !== 'pglite') return Promise.resolve();
  cache.migrated ??= runMigrations().catch((error) => {
    cache.migrated = undefined;
    throw error;
  });
  return cache.migrated;
}

export { schema };
export * from './schema';
