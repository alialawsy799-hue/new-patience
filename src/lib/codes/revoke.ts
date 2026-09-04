import 'server-only';
import { and, eq, sql } from 'drizzle-orm';
import { db, ensureMigrated } from '@/lib/db';
import { activationCodes, studentStageAccess } from '@/lib/db/schema';

export type RevokeResult =
  | { ok: true; studentId: string | null; stageId: string }
  | { ok: false; reason: 'not_found' | 'already_revoked' };

/**
 * Marks a code revoked and withdraws any access it granted.
 *
 * The student's session is left intact so other stages they hold stay usable;
 * only the stage this code unlocked is closed.
 */
export async function revokeActivationCode(
  codeId: string,
  reason: string,
): Promise<RevokeResult> {
  await ensureMigrated();

  return db.transaction(async (tx) => {
    const [code] = await tx
      .select({
        id: activationCodes.id,
        status: activationCodes.status,
        studentId: activationCodes.studentId,
        stageId: activationCodes.stageId,
      })
      .from(activationCodes)
      .where(eq(activationCodes.id, codeId))
      .limit(1);

    if (!code) return { ok: false, reason: 'not_found' as const };
    if (code.status === 'revoked') return { ok: false, reason: 'already_revoked' as const };

    await tx
      .update(activationCodes)
      .set({
        status: 'revoked',
        revokedAt: new Date(),
        revokedReason: reason.trim().slice(0, 400),
      })
      .where(eq(activationCodes.id, codeId));

    if (code.studentId) {
      await tx
        .update(studentStageAccess)
        .set({ isRevoked: true, revokedAt: new Date() })
        .where(
          and(
            eq(studentStageAccess.studentId, code.studentId),
            eq(studentStageAccess.stageId, code.stageId),
            eq(studentStageAccess.isRevoked, false),
          ),
        );
    }

    return { ok: true, studentId: code.studentId, stageId: code.stageId };
  });
}

export async function grantStageAccess(studentId: string, stageId: string) {
  await ensureMigrated();

  await db
    .insert(studentStageAccess)
    .values({ studentId, stageId, source: 'admin_grant', isRevoked: false })
    .onConflictDoUpdate({
      target: [studentStageAccess.studentId, studentStageAccess.stageId],
      set: {
        isRevoked: false,
        revokedAt: null,
        source: 'admin_grant',
        grantedAt: sql`now()`,
      },
    });
}

export async function revokeStageAccess(studentId: string, stageId: string) {
  await ensureMigrated();

  await db
    .update(studentStageAccess)
    .set({ isRevoked: true, revokedAt: new Date() })
    .where(
      and(
        eq(studentStageAccess.studentId, studentId),
        eq(studentStageAccess.stageId, stageId),
        eq(studentStageAccess.isRevoked, false),
      ),
    );
}
