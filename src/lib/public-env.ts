/**
 * Public site origin. Safe to import from sitemap, robots, and metadata.
 * Never put secrets in this file.
 */
function trimSlash(url: string): string {
  return url.replace(/\/$/, '');
}

function optional(key: string): string {
  const value = process.env[key];
  return value === undefined || value.trim() === '' ? '' : value.trim();
}

function resolveSiteUrl(): string {
  const explicit = optional('NEXT_PUBLIC_SITE_URL');
  if (explicit) return trimSlash(explicit);

  const production = optional('VERCEL_PROJECT_PRODUCTION_URL');
  if (production) return trimSlash(`https://${production}`);

  const deployment = optional('VERCEL_URL');
  if (deployment) return trimSlash(`https://${deployment}`);

  return 'http://localhost:3000';
}

export const publicEnv = {
  siteUrl: resolveSiteUrl(),
};
