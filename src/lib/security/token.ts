import crypto from 'node:crypto';
import { env } from '@/lib/env';

/**
 * Compact HMAC-signed tokens used for the session cookies.
 *
 * Format: `base64url(payload).base64url(HMAC-SHA256(payload))`.
 * The payload is not encrypted — it only ever carries a record id, a session
 * version and an expiry — but it is authenticated, so a client cannot change
 * which student or admin it points at.
 */

type SignedPayload<T> = T & { exp: number; iat: number };

function key(purpose: string): Buffer {
  // Domain-separated sub-keys: a student cookie can never be replayed as an
  // admin cookie even though both derive from SESSION_SECRET.
  return crypto
    .createHmac('sha256', Buffer.from(env.secrets.session, 'base64'))
    .update(`patience:${purpose}`)
    .digest();
}

export function signToken<T extends Record<string, unknown>>(
  purpose: string,
  payload: T,
  ttlSeconds: number,
): string {
  const now = Math.floor(Date.now() / 1000);
  const body: SignedPayload<T> = { ...payload, iat: now, exp: now + ttlSeconds };
  const encoded = Buffer.from(JSON.stringify(body), 'utf8').toString('base64url');
  const signature = crypto.createHmac('sha256', key(purpose)).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifyToken<T extends Record<string, unknown>>(
  purpose: string,
  token: string | undefined | null,
): SignedPayload<T> | null {
  if (!token) return null;

  const separator = token.lastIndexOf('.');
  if (separator <= 0) return null;

  const encoded = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  const expected = crypto.createHmac('sha256', key(purpose)).update(encoded).digest('base64url');
  const given = Buffer.from(signature);
  const want = Buffer.from(expected);
  if (given.length !== want.length || !crypto.timingSafeEqual(given, want)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SignedPayload<T>;
    if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
