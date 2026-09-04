import 'server-only';
import { and, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';
import { db, ensureMigrated } from '@/lib/db';
import { activationCodes, stages, students, type CodeStatus } from '@/lib/db/schema';
import { decryptActivationCode, hashActivationCode, normalizeActivationCode } from '@/lib/security/crypto';
import { buildPageInfo, type PageInfo } from './pagination';

/**
 * A code row as the dashboard is allowed to see it.
 *
 * The plain code is decrypted here for the admin table only — never for the
 * public site. `codeHash` and `codeCipher` stay off the response.
 */
export type AdminCodeRow = {
  id: string;
  code: string;
  codeHint: string;
  status: CodeStatus;
  stageId: string;
  stageNumber: number;
  stageTitleAr: string;
  stageTitleEn: string;
  studentId: string | null;
  studentName: string | null;
  activatedAt: Date | null;
  createdAt: Date;
  revokedReason: string | null;
};

export type CodeFilters = {
  page: number;
  pageSize: number;
  stageId?: string;
  status?: CodeStatus;
  search?: string;
};

/** `%` and `_` are LIKE wildcards; a search box must treat them literally. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

function codeConditions(filters: CodeFilters): SQL | undefined {
  const clauses: (SQL | undefined)[] = [];
  if (filters.stageId) clauses.push(eq(activationCodes.stageId, filters.stageId));
  if (filters.status) clauses.push(eq(activationCodes.status, filters.status));

  const search = filters.search?.trim();
  if (search) {
    const exact = normalizeActivationCode(search);
    if (exact) {
      clauses.push(eq(activationCodes.codeHash, hashActivationCode(exact)));
    } else {
      const pattern = `%${escapeLike(search)}%`;
      clauses.push(or(ilike(activationCodes.codeHint, pattern), ilike(students.name, pattern)));
    }
  }

  const active = clauses.filter((clause): clause is SQL => Boolean(clause));
  return active.length > 0 ? and(...active) : undefined;
}

export async function listCodes(
  filters: CodeFilters,
): Promise<{ rows: AdminCodeRow[]; pageInfo: PageInfo }> {
  await ensureMigrated();

  const where = codeConditions(filters);

  const [totalRow] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(activationCodes)
    .leftJoin(students, eq(activationCodes.studentId, students.id))
    .where(where);

  const pageInfo = buildPageInfo(filters.page, filters.pageSize, Number(totalRow?.value ?? 0));

  const rows = await db
    .select({
      id: activationCodes.id,
      codeCipher: activationCodes.codeCipher,
      codeHint: activationCodes.codeHint,
      status: activationCodes.status,
      stageId: activationCodes.stageId,
      stageNumber: stages.number,
      stageTitleAr: stages.titleAr,
      stageTitleEn: stages.titleEn,
      studentId: activationCodes.studentId,
      studentName: students.name,
      activatedAt: activationCodes.activatedAt,
      createdAt: activationCodes.createdAt,
      revokedReason: activationCodes.revokedReason,
    })
    .from(activationCodes)
    .innerJoin(stages, eq(activationCodes.stageId, stages.id))
    .leftJoin(students, eq(activationCodes.studentId, students.id))
    .where(where)
    .orderBy(desc(activationCodes.createdAt), desc(activationCodes.id))
    .limit(pageInfo.pageSize)
    .offset(pageInfo.offset);

  return {
    rows: rows.map(({ codeCipher, ...row }) => ({
      ...row,
      code: decryptActivationCode(codeCipher),
    })),
    pageInfo,
  };
}

export async function countAllCodes(): Promise<number> {
  await ensureMigrated();
  const [row] = await db.select({ value: sql<number>`count(*)::int` }).from(activationCodes);
  return Number(row?.value ?? 0);
}
