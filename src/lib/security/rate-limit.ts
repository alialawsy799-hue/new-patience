import { sql } from 'drizzle-orm';
import { db, ensureMigrated } from '@/lib/db';

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * Fixed-window rate limiter backed by a single atomic PostgreSQL upsert.
 *
 * Storing the counter in the database (rather than in process memory) means the
 * limit survives restarts and holds across every serverless instance — which is
 * the only way it actually protects the activation endpoint in production.
 */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  await ensureMigrated();

  const result = await db.execute(sql`
    INSERT INTO rate_limit_buckets ("key", "count", "expires_at")
    VALUES (${key}, 1, now() + make_interval(secs => ${windowSeconds}))
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN rate_limit_buckets."expires_at" < now() THEN 1
        ELSE rate_limit_buckets."count" + 1
      END,
      "expires_at" = CASE
        WHEN rate_limit_buckets."expires_at" < now()
          THEN now() + make_interval(secs => ${windowSeconds})
        ELSE rate_limit_buckets."expires_at"
      END
    RETURNING "count", "expires_at"
  `);

  const rows = (result as unknown as { rows?: unknown[] }).rows ?? (result as unknown as unknown[]);
  const row = (rows as { count: number | string; expires_at: string | Date }[])[0];
  if (!row) return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };

  const count = typeof row.count === 'string' ? Number.parseInt(row.count, 10) : row.count;
  const expiresAt = row.expires_at instanceof Date ? row.expires_at : new Date(row.expires_at);
  const retryAfterSeconds = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 1000));

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    retryAfterSeconds,
  };
}

/** Called after a successful authentication so honest users are not punished. */
export async function resetRateLimit(key: string): Promise<void> {
  await db.execute(sql`DELETE FROM rate_limit_buckets WHERE "key" = ${key}`);
}

export async function purgeExpiredRateLimits(): Promise<void> {
  await db.execute(sql`DELETE FROM rate_limit_buckets WHERE "expires_at" < now()`);
}
