import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  activationCodes,
  studentStageAccess,
  students,
  type Student,
  type StudentTitle,
} from '@/lib/db/schema';
import { hashActivationCode, normalizeActivationCode } from '@/lib/security/crypto';

export type ActivationFailure =
  | 'invalid_format'
  | 'invalid_code'
  | 'already_used'
  | 'revoked'
  | 'stage_mismatch'
  | 'stage_unavailable';

export type ActivationResult =
  | {
      ok: true;
      student: Student;
      stageId: string;
      stageSlug: string;
      /** True when the code granted access the student did not already have. */
      granted: boolean;
    }
  | { ok: false; reason: ActivationFailure; stageSlug?: string };

type ActivateInput = {
  rawCode: string;
  name: string;
  title: StudentTitle;
  locale: 'ar' | 'en';
  /** When present the code is attached to this existing student. */
  existingStudentId?: string | null;
  /** When present the code must belong to this stage. */
  expectedStageId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

/**
 * Redeems an activation code.
 *
 * The whole redemption happens inside one transaction, and the code is claimed
 * with a conditional UPDATE:
 *
 *   UPDATE activation_codes SET status='activated' … WHERE code_hash=$1 AND status='unused'
 *
 * PostgreSQL takes a row lock on that statement, so if two people submit the
 * same code at the same instant the second one re-evaluates `status='unused'`
 * after the first commits, matches zero rows, and its transaction is rolled
 * back. Exactly one student can ever win a code.
 */
/** Thrown inside the transaction so the student row is rolled back with it. */
class ActivationRaceLost extends Error {
  constructor() {
    super('ACTIVATION_RACE_LOST');
    this.name = 'ActivationRaceLost';
  }
}

export async function activateCode(input: ActivateInput): Promise<ActivationResult> {
  const normalized = normalizeActivationCode(input.rawCode);
  if (!normalized) return { ok: false, reason: 'invalid_format' };

  const codeHash = hashActivationCode(normalized);

  try {
    return await runActivation(codeHash, input);
  } catch (error) {
    if (error instanceof ActivationRaceLost) return { ok: false, reason: 'already_used' };
    throw error;
  }
}

function runActivation(codeHash: string, input: ActivateInput): Promise<ActivationResult> {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({
        id: activationCodes.id,
        status: activationCodes.status,
        stageId: activationCodes.stageId,
      })
      .from(activationCodes)
      .where(eq(activationCodes.codeHash, codeHash))
      .limit(1);

    if (!existing) return { ok: false, reason: 'invalid_code' } as const;
    if (existing.status === 'revoked') return { ok: false, reason: 'revoked' } as const;
    if (existing.status === 'activated') return { ok: false, reason: 'already_used' } as const;

    const stage = await tx.query.stages.findFirst({
      where: (table, { eq: equals }) => equals(table.id, existing.stageId),
      columns: { id: true, slug: true, isPublished: true },
    });
    if (!stage) return { ok: false, reason: 'stage_unavailable' } as const;
    if (!stage.isPublished) {
      return { ok: false, reason: 'stage_unavailable', stageSlug: stage.slug } as const;
    }

    if (input.expectedStageId && input.expectedStageId !== existing.stageId) {
      return { ok: false, reason: 'stage_mismatch', stageSlug: stage.slug } as const;
    }

    // Reuse the signed-in student when there is one, so a second code simply
    // adds another stage to the same profile.
    let student: Student | undefined;
    if (input.existingStudentId) {
      const [found] = await tx
        .select()
        .from(students)
        .where(and(eq(students.id, input.existingStudentId), eq(students.isActive, true)))
        .limit(1);
      student = found;
    }

    if (!student) {
      const [created] = await tx
        .insert(students)
        .values({
          name: input.name,
          title: input.title,
          locale: input.locale,
        })
        .returning();
      student = created;
    }

    // The atomic claim. `status = 'unused'` in the predicate is what makes a
    // code single-use under concurrency.
    const claimed = await tx
      .update(activationCodes)
      .set({
        status: 'activated',
        studentId: student.id,
        activatedAt: new Date(),
        activatedIp: input.ipAddress ?? null,
        activatedUserAgent: input.userAgent?.slice(0, 400) ?? null,
      })
      .where(and(eq(activationCodes.codeHash, codeHash), eq(activationCodes.status, 'unused')))
      .returning({ id: activationCodes.id });

    if (claimed.length === 0) {
      // Another request won the race between our read and our write. Throwing
      // rolls the transaction back, discarding the student we just created.
      throw new ActivationRaceLost();
    }

    const grant = await tx
      .insert(studentStageAccess)
      .values({
        studentId: student.id,
        stageId: existing.stageId,
        activationCodeId: claimed[0].id,
        source: 'activation',
      })
      .onConflictDoUpdate({
        target: [studentStageAccess.studentId, studentStageAccess.stageId],
        // Re-granting after a revoke should restore access.
        set: { isRevoked: false, revokedAt: null, grantedAt: new Date() },
      })
      .returning({ id: studentStageAccess.id, grantedAt: studentStageAccess.grantedAt });

    await tx
      .update(students)
      .set({ lastSeenAt: new Date(), updatedAt: new Date() })
      .where(eq(students.id, student.id));

    return {
      ok: true,
      student,
      stageId: existing.stageId,
      stageSlug: stage.slug,
      granted: grant.length > 0,
    } as const;
  });
}

/** Admin action: takes a code out of circulation without deleting the record. */
export async function revokeCode(codeId: string, reason: string) {
  const [updated] = await db
    .update(activationCodes)
    .set({ status: 'revoked', revokedAt: new Date(), revokedReason: reason.slice(0, 300) })
    .where(and(eq(activationCodes.id, codeId), sql`${activationCodes.status} <> 'revoked'`))
    .returning({ id: activationCodes.id, studentId: activationCodes.studentId });

  if (updated?.studentId) {
    // Revoking an already-redeemed code also withdraws the access it granted.
    await db
      .update(studentStageAccess)
      .set({ isRevoked: true, revokedAt: new Date() })
      .where(eq(studentStageAccess.activationCodeId, codeId));
  }

  return updated ?? null;
}
