import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { db, ensureMigrated } from '@/lib/db';
import { students, type Student } from '@/lib/db/schema';
import { env } from '@/lib/env';
import { signToken, verifyToken } from '@/lib/security/token';

export const STUDENT_COOKIE = 'pt_student';
const PURPOSE = 'student-session';

type StudentTokenPayload = {
  sub: string;
  ver: number;
};

function ttlSeconds(): number {
  return env.sessions.studentDays * 24 * 60 * 60;
}

/**
 * Issues the student session cookie.
 *
 * The activation code is deliberately *not* part of the credential: once a code
 * is redeemed it is dead, and the student's continued access rests on this
 * signed cookie alone.
 */
export async function createStudentSession(student: Pick<Student, 'id' | 'sessionVersion'>) {
  const token = signToken<StudentTokenPayload>(
    PURPOSE,
    { sub: student.id, ver: student.sessionVersion },
    ttlSeconds(),
  );

  const store = await cookies();
  store.set(STUDENT_COOKIE, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: ttlSeconds(),
  });
}

export async function clearStudentSession() {
  const store = await cookies();
  store.set(STUDENT_COOKIE, '', {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Resolves the signed cookie to a live student row.
 *
 * Every request re-reads the database rather than trusting the cookie payload,
 * so an admin revoking access (`is_active = false`) or bumping
 * `session_version` takes effect immediately on the next request.
 *
 * `cache()` deduplicates this within a single render pass only — it is not a
 * cross-request cache.
 */
export const getStudentSession = cache(async (): Promise<Student | null> => {
  const store = await cookies();
  const token = store.get(STUDENT_COOKIE)?.value;
  const payload = verifyToken<StudentTokenPayload>(PURPOSE, token);
  if (!payload?.sub) return null;

  await ensureMigrated();

  const [student] = await db.select().from(students).where(eq(students.id, payload.sub)).limit(1);
  if (!student) return null;
  if (!student.isActive) return null;
  if (student.sessionVersion !== payload.ver) return null;

  return student;
});

/** Throws instead of returning null — for API routes that must have a student. */
export async function requireStudent(): Promise<Student> {
  const student = await getStudentSession();
  if (!student) {
    const error = new Error('UNAUTHENTICATED');
    error.name = 'UnauthenticatedError';
    throw error;
  }
  return student;
}

export async function touchStudentActivity(studentId: string) {
  await db.update(students).set({ lastSeenAt: new Date() }).where(eq(students.id, studentId));
}
