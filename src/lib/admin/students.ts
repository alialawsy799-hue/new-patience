import 'server-only';
import { and, desc, eq, ilike, inArray, sql, type SQL } from 'drizzle-orm';
import { db, ensureMigrated } from '@/lib/db';
import {
  activationCodes,
  lessonProgress,
  lessons,
  stageCompletions,
  stages,
  studentStageAccess,
  students,
  type Student,
  type StudentTitle,
} from '@/lib/db/schema';
import { percentage } from '@/lib/utils';
import { escapeLike } from './codes';
import { buildPageInfo, type PageInfo } from './pagination';

export type StudentAccessRow = {
  stageId: string;
  stageNumber: number;
  titleAr: string;
  titleEn: string;
  isRevoked: boolean;
  grantedAt: Date;
  source: string;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  isCompleted: boolean;
  completedAt: Date | null;
};

export type AdminStudentRow = {
  id: string;
  name: string;
  title: StudentTitle;
  locale: 'ar' | 'en';
  email: string | null;
  phone: string | null;
  isActive: boolean;
  lastSeenAt: Date;
  createdAt: Date;
  stageLabels: string;
  stageCount: number;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
};

export type StudentFilters = {
  page: number;
  pageSize: number;
  search?: string;
  status?: 'active' | 'inactive';
};

function studentWhere(filters: StudentFilters): SQL | undefined {
  const clauses: SQL[] = [];
  if (filters.status === 'active') clauses.push(eq(students.isActive, true));
  if (filters.status === 'inactive') clauses.push(eq(students.isActive, false));
  const search = filters.search?.trim();
  if (search) clauses.push(ilike(students.name, `%${escapeLike(search)}%`));
  return clauses.length > 0 ? and(...clauses) : undefined;
}

export async function listStudents(
  filters: StudentFilters,
): Promise<{ rows: AdminStudentRow[]; pageInfo: PageInfo }> {
  await ensureMigrated();
  const where = studentWhere(filters);

  const [totalRow] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(students)
    .where(where);

  const pageInfo = buildPageInfo(filters.page, filters.pageSize, Number(totalRow?.value ?? 0));

  const base = await db
    .select({
      id: students.id,
      name: students.name,
      title: students.title,
      locale: students.locale,
      email: students.email,
      phone: students.phone,
      isActive: students.isActive,
      lastSeenAt: students.lastSeenAt,
      createdAt: students.createdAt,
    })
    .from(students)
    .where(where)
    .orderBy(desc(students.createdAt))
    .limit(pageInfo.pageSize)
    .offset(pageInfo.offset);

  if (base.length === 0) return { rows: [], pageInfo };

  const ids = base.map((row) => row.id);

  const accessRows = await db
    .select({
      studentId: studentStageAccess.studentId,
      stageId: studentStageAccess.stageId,
      stageNumber: stages.number,
      titleAr: stages.titleAr,
      titleEn: stages.titleEn,
      isRevoked: studentStageAccess.isRevoked,
    })
    .from(studentStageAccess)
    .innerJoin(stages, eq(studentStageAccess.stageId, stages.id))
    .where(inArray(studentStageAccess.studentId, ids));

  const totals = await db
    .select({
      studentId: studentStageAccess.studentId,
      total: sql<number>`count(*)::int`,
      completed: sql<number>`coalesce(sum(case when ${lessonProgress.completed} then 1 else 0 end), 0)::int`,
    })
    .from(studentStageAccess)
    .innerJoin(
      lessons,
      and(eq(lessons.stageId, studentStageAccess.stageId), eq(lessons.isPublished, true)),
    )
    .leftJoin(
      lessonProgress,
      and(
        eq(lessonProgress.lessonId, lessons.id),
        eq(lessonProgress.studentId, studentStageAccess.studentId),
      ),
    )
    .where(and(inArray(studentStageAccess.studentId, ids), eq(studentStageAccess.isRevoked, false)))
    .groupBy(studentStageAccess.studentId);

  const totalsByStudent = new Map(totals.map((row) => [row.studentId, row]));
  const accessByStudent = new Map<string, typeof accessRows>();
  for (const row of accessRows) {
    const list = accessByStudent.get(row.studentId) ?? [];
    list.push(row);
    accessByStudent.set(row.studentId, list);
  }

  const rows: AdminStudentRow[] = base.map((student) => {
    const access = (accessByStudent.get(student.id) ?? []).filter((row) => !row.isRevoked);
    const stats = totalsByStudent.get(student.id);
    const totalLessons = Number(stats?.total ?? 0);
    const completedLessons = Number(stats?.completed ?? 0);
    return {
      ...student,
      stageLabels: access
        .sort((a, b) => a.stageNumber - b.stageNumber)
        .map((row) => String(row.stageNumber))
        .join(', '),
      stageCount: access.length,
      completedLessons,
      totalLessons,
      progressPercent: percentage(completedLessons, totalLessons),
    };
  });

  return { rows, pageInfo };
}

export type StudentDetail = {
  student: Student;
  access: StudentAccessRow[];
  codes: {
    id: string;
    codeHint: string;
    status: string;
    stageNumber: number;
    activatedAt: Date | null;
  }[];
};

export async function getStudentDetail(studentId: string): Promise<StudentDetail | null> {
  await ensureMigrated();

  const [student] = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
  if (!student) return null;

  const [accessRows, progressRows, completionRows, codeRows] = await Promise.all([
    db
      .select({
        stageId: studentStageAccess.stageId,
        stageNumber: stages.number,
        titleAr: stages.titleAr,
        titleEn: stages.titleEn,
        isRevoked: studentStageAccess.isRevoked,
        grantedAt: studentStageAccess.grantedAt,
        source: studentStageAccess.source,
        totalLessons: sql<number>`(
          select count(*)::int from ${lessons}
          where ${lessons.stageId} = ${stages.id} and ${lessons.isPublished} = true
        )`,
      })
      .from(studentStageAccess)
      .innerJoin(stages, eq(studentStageAccess.stageId, stages.id))
      .where(eq(studentStageAccess.studentId, studentId))
      .orderBy(stages.number),
    db
      .select({
        stageId: lessons.stageId,
        completed: sql<number>`count(*)::int`,
      })
      .from(lessonProgress)
      .innerJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
      .where(and(eq(lessonProgress.studentId, studentId), eq(lessonProgress.completed, true)))
      .groupBy(lessons.stageId),
    db
      .select({
        stageId: stageCompletions.stageId,
        completedAt: stageCompletions.completedAt,
      })
      .from(stageCompletions)
      .where(eq(stageCompletions.studentId, studentId)),
    db
      .select({
        id: activationCodes.id,
        codeHint: activationCodes.codeHint,
        status: activationCodes.status,
        stageNumber: stages.number,
        activatedAt: activationCodes.activatedAt,
      })
      .from(activationCodes)
      .innerJoin(stages, eq(activationCodes.stageId, stages.id))
      .where(eq(activationCodes.studentId, studentId))
      .orderBy(desc(activationCodes.activatedAt)),
  ]);

  const completedByStage = new Map(progressRows.map((row) => [row.stageId, Number(row.completed)]));
  const completionByStage = new Map(completionRows.map((row) => [row.stageId, row.completedAt]));

  const access: StudentAccessRow[] = accessRows.map((row) => {
    const totalLessons = Number(row.totalLessons);
    const completedLessons = completedByStage.get(row.stageId) ?? 0;
    return {
      stageId: row.stageId,
      stageNumber: row.stageNumber,
      titleAr: row.titleAr,
      titleEn: row.titleEn,
      isRevoked: row.isRevoked,
      grantedAt: row.grantedAt,
      source: row.source,
      completedLessons,
      totalLessons,
      progressPercent: percentage(completedLessons, totalLessons),
      isCompleted: Boolean(completionByStage.get(row.stageId)),
      completedAt: completionByStage.get(row.stageId) ?? null,
    };
  });

  return { student, access, codes: codeRows };
}

export async function setStudentActive(studentId: string, isActive: boolean) {
  await ensureMigrated();
  await db
    .update(students)
    .set({
      isActive,
      sessionVersion: sql`${students.sessionVersion} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(students.id, studentId));
}
