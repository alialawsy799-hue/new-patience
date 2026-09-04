import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { db, ensureMigrated } from '@/lib/db';
import { adminUsers, type AdminUser } from '@/lib/db/schema';
import { env } from '@/lib/env';
import { signToken, verifyToken } from '@/lib/security/token';

export const ADMIN_COOKIE = 'pt_admin';
const PURPOSE = 'admin-session';

type AdminTokenPayload = {
  sub: string;
  ver: number;
};

function ttlSeconds(): number {
  return env.sessions.adminHours * 60 * 60;
}

export async function createAdminSession(admin: Pick<AdminUser, 'id' | 'sessionVersion'>) {
  const token = signToken<AdminTokenPayload>(
    PURPOSE,
    { sub: admin.id, ver: admin.sessionVersion },
    ttlSeconds(),
  );

  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: env.isProduction,
    // Admin cookies are strict: they should never ride along on any
    // cross-site navigation, not even a top-level GET.
    sameSite: 'strict',
    path: '/',
    maxAge: ttlSeconds(),
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, '', {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
}

export const getAdminSession = cache(async (): Promise<AdminUser | null> => {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  const payload = verifyToken<AdminTokenPayload>(PURPOSE, token);
  if (!payload?.sub) return null;

  await ensureMigrated();

  const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.id, payload.sub)).limit(1);
  if (!admin || !admin.isActive) return null;
  if (admin.sessionVersion !== payload.ver) return null;

  return admin;
});

export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminSession();
  if (!admin) {
    const error = new Error('UNAUTHENTICATED');
    error.name = 'UnauthenticatedError';
    throw error;
  }
  return admin;
}

/** `owner` and `admin` may mutate; `staff` may manage codes and the store only. */
export function canManageCodes(admin: AdminUser): boolean {
  return admin.role === 'owner' || admin.role === 'admin' || admin.role === 'staff';
}

export function canManageStore(admin: AdminUser): boolean {
  return admin.role === 'owner' || admin.role === 'admin' || admin.role === 'staff';
}

export function canManageCourses(admin: AdminUser): boolean {
  return admin.role === 'owner' || admin.role === 'admin' || admin.role === 'editor';
}

export function canManageOperations(admin: AdminUser): boolean {
  return admin.role === 'owner' || admin.role === 'admin';
}

export function canManageAdmins(admin: AdminUser): boolean {
  return admin.role === 'owner';
}

/** Throws so API routes can lean on `withErrorHandling`. */
export async function requireAdminApi(): Promise<AdminUser> {
  return requireAdmin();
}

function forbid() {
  const error = new Error('FORBIDDEN');
  error.name = 'ForbiddenError';
  throw error;
}

export function assertOperations(admin: AdminUser) {
  if (!canManageOperations(admin)) forbid();
}

export function assertCodes(admin: AdminUser) {
  if (!canManageCodes(admin)) forbid();
}

export function assertStore(admin: AdminUser) {
  if (!canManageStore(admin)) forbid();
}

export function assertCourses(admin: AdminUser) {
  if (!canManageCourses(admin)) forbid();
}
