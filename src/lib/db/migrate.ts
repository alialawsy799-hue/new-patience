import { env } from '@/lib/env';
import { runMigrations } from './index';

async function main() {
  const target = env.database.driver === 'pglite' ? env.database.pgliteDir : 'PostgreSQL server';
  console.log(`→ Applying migrations (driver: ${env.database.driver}, target: ${target})`);
  await runMigrations();
  console.log('✓ Migrations applied.');
  process.exit(0);
}

main().catch((error) => {
  console.error('✗ Migration failed:', error);
  process.exit(1);
});
