import { env } from '@/lib/env';

/**
 * Best-effort client IP.
 *
 * Behind Vercel/Cloudflare/nginx the left-most `x-forwarded-for` entry is the
 * real client. It is attacker-controlled when the app is exposed without a
 * proxy, so it is only used for rate limiting and audit context — never for
 * authorisation decisions.
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return (
    headers.get('x-real-ip') ??
    headers.get('cf-connecting-ip') ??
    headers.get('x-vercel-forwarded-for') ??
    'unknown'
  );
}

export function getUserAgent(request: Request): string {
  return (request.headers.get('user-agent') ?? 'unknown').slice(0, 400);
}

/**
 * Same-origin enforcement for every state-changing request. This is the
 * primary CSRF defence: a cross-site form post cannot forge `Origin`, and
 * browsers always send it for non-GET requests.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const allowed = new Set<string>([env.siteUrl]);

  const host = request.headers.get('host');
  if (host) {
    allowed.add(`https://${host}`);
    if (!env.isProduction) allowed.add(`http://${host}`);
  }

  if (origin) return allowed.has(origin.replace(/\/$/, ''));

  // Some browsers omit Origin on same-origin navigations; fall back to Referer.
  const referer = request.headers.get('referer');
  if (referer) {
    try {
      return allowed.has(new URL(referer).origin);
    } catch {
      return false;
    }
  }

  // No Origin and no Referer: reject rather than guess.
  return false;
}
