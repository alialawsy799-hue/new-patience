import 'server-only';
import { cache } from 'react';
import { eq } from 'drizzle-orm';
import { db, ensureMigrated } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';
import { SETTINGS_KEY, mergeSettings, type SiteSettings } from './defaults';

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  await ensureMigrated();
  const [row] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, SETTINGS_KEY))
    .limit(1);
  return mergeSettings(row?.value);
});

export async function saveSiteSettings(next: SiteSettings): Promise<SiteSettings> {
  const merged = mergeSettings(next);
  await db
    .insert(siteSettings)
    .values({ key: SETTINGS_KEY, value: merged, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: { value: merged, updatedAt: new Date() },
    });
  return merged;
}

export * from './defaults';
