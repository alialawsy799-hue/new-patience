import crypto from 'node:crypto';
import { env } from '@/lib/env';

/**
 * Activation-code alphabet.
 *
 * Crockford-style: no 0/O/1/I/L so a code read off paper or dictated over the
 * phone cannot be mistyped into a different valid code. 31 symbols ≈ 4.95 bits
 * each, so a 10-symbol code carries ~49.5 bits — about 8.2e14 possibilities
 * against 2,500 live codes. Guessing is not a realistic attack even before the
 * per-IP rate limit is taken into account.
 */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const ALPHABET_LENGTH = ALPHABET.length;
const CODE_SYMBOLS = 10;
export const CODE_PREFIX = 'PAT';

/** Rejection sampling keeps every symbol uniformly distributed. */
function randomSymbols(count: number): string {
  const max = Math.floor(256 / ALPHABET_LENGTH) * ALPHABET_LENGTH;
  let out = '';
  while (out.length < count) {
    const bytes = crypto.randomBytes(count * 2);
    for (const byte of bytes) {
      if (byte >= max) continue;
      out += ALPHABET[byte % ALPHABET_LENGTH];
      if (out.length === count) break;
    }
  }
  return out;
}

/** Produces a code shaped like `PAT-7K4X-92LM-Q8`. */
export function generateActivationCode(): string {
  const symbols = randomSymbols(CODE_SYMBOLS);
  return `${CODE_PREFIX}-${symbols.slice(0, 4)}-${symbols.slice(4, 8)}-${symbols.slice(8, 10)}`;
}

/**
 * Canonicalises user input before hashing, so that casing, spaces, Arabic-Indic
 * digits and missing/extra dashes never cause a false "invalid code".
 * Characters outside the alphabet are a genuine typo and fail validation.
 */
export function normalizeActivationCode(input: string): string | null {
  const arabicIndicDigits = /[\u0660-\u0669\u06F0-\u06F9]/g;
  const asciiDigits = input.replace(arabicIndicDigits, (digit) =>
    String(digit.charCodeAt(0) & 0x0f),
  );

  const cleaned = asciiDigits.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const symbols = cleaned.startsWith(CODE_PREFIX) ? cleaned.slice(CODE_PREFIX.length) : cleaned;

  if (symbols.length !== CODE_SYMBOLS) return null;
  if (!symbols.split('').every((char) => ALPHABET.includes(char))) return null;

  return `${CODE_PREFIX}-${symbols.slice(0, 4)}-${symbols.slice(4, 8)}-${symbols.slice(8, 10)}`;
}

/**
 * Deterministic lookup key. Peppered HMAC rather than a plain hash so a stolen
 * database dump alone cannot be brute-forced offline against the small code
 * keyspace — the attacker also needs CODE_HASH_PEPPER from the environment.
 */
export function hashActivationCode(code: string): string {
  return crypto.createHmac('sha256', Buffer.from(env.secrets.codePepper, 'base64')).update(code).digest('hex');
}

const AES_ALGORITHM = 'aes-256-gcm';

/**
 * Codes are also kept encrypted (not just hashed) because an administrator has
 * to be able to re-export the printable list. Decryption only ever happens
 * inside an admin-authenticated export route.
 */
export function encryptActivationCode(code: string): string {
  const key = Buffer.from(env.secrets.codeEncryption, 'base64');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(AES_ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(code, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
}

export function decryptActivationCode(payload: string): string {
  const [ivPart, tagPart, dataPart] = payload.split('.');
  if (!ivPart || !tagPart || !dataPart) throw new Error('Malformed activation code ciphertext.');
  const key = Buffer.from(env.secrets.codeEncryption, 'base64');
  const decipher = crypto.createDecipheriv(AES_ALGORITHM, key, Buffer.from(ivPart, 'base64'));
  decipher.setAuthTag(Buffer.from(tagPart, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(dataPart, 'base64')), decipher.final()]).toString('utf8');
}

/** Safe to render in admin tables: reveals nothing usable. */
export function activationCodeHint(code: string): string {
  return code.slice(-4);
}

export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function timingSafeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) {
    // Still perform a comparison so the failure path costs the same.
    crypto.timingSafeEqual(bufferA, bufferA);
    return false;
  }
  return crypto.timingSafeEqual(bufferA, bufferB);
}
