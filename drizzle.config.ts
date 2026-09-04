import './src/lib/load-env';
import { defineConfig } from 'drizzle-kit';

/**
 * Migrations are always generated against the PostgreSQL dialect, regardless of
 * which driver runs them, so development and production stay identical.
 */
export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  strict: true,
  verbose: true,
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://user:password@localhost:5432/patience',
  },
});
