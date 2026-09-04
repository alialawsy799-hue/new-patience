import 'server-only';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db, ensureMigrated } from '@/lib/db';
import {
  activationCodes,
  contactMessages,
  lessonProgress,
  lessons,
  orders,
  products,
  stageCompletions,
  stages,
  studentStageAccess,
  students,
  type OrderStatus,
} from '@/lib/db/schema';
import { percentage } from '@/lib/utils';

export type OverviewCounters = {
  totalStudents: number;
  activatedStudents: number;
  unusedCodes: number;
  activatedCodes: number;
  revokedCodes: number;
  stagesCompleted: number;
  averageProgress: number;
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  newMessages: number;
  orderValueCents: number;
};

export type StageBreakdownRow = {
  stageId: string;
  number: number;
  titleAr: string;
  titleEn: string;
  accent: string;
  studentCount: number;
  lessonCount: number;
};

export type RecentActivationRow = {
  codeId: string;
  studentId: string | null;
  studentName: string | null;
  stageNumber: number;
  stageTitleAr: string;
  stageTitleEn: string;
  activatedAt: Date | null;
};

export type RecentOrderRow = {
  id: string;
  orderNumber: string;
  customerName: string;
  totalCents: number;
  currency: string;
  status: OrderStatus;
  createdAt: Date;
};

export type OverviewData = {
  counters: OverviewCounters;
  stageBreakdown: StageBreakdownRow[];
  recentActivations: RecentActivationRow[];
  recentOrders: RecentOrderRow[];
};

const countInt = sql<number>`count(*)::int`;

/**
 * One pass over the database for the dashboard.
 *
 * Every number here is a real aggregate: the counters are `count(*)` over the
 * relevant table, and `averageProgress` is the ratio of completed lessons to
 * the lessons students actually hold access to — so publishing a new lesson
 * lowers it, exactly as it should.
 */
export async function getOverviewData(): Promise<OverviewData> {
  await ensureMigrated();

  const [
    studentRows,
    activatedStudentRows,
    codeStatusRows,
    stageCompletionRows,
    progressRows,
    productRows,
    orderRows,
    messageRows,
    stageBreakdown,
    recentActivations,
    recentOrders,
  ] = await Promise.all([
    db.select({ value: countInt }).from(students),

    db
      .select({ value: sql<number>`count(distinct ${studentStageAccess.studentId})::int` })
      .from(studentStageAccess)
      .where(eq(studentStageAccess.isRevoked, false)),

    db
      .select({ status: activationCodes.status, value: countInt })
      .from(activationCodes)
      .groupBy(activationCodes.status),

    db.select({ value: countInt }).from(stageCompletions),

    db
      .select({
        accessible: countInt,
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
      .where(eq(studentStageAccess.isRevoked, false)),

    db.select({ value: countInt }).from(products),

    db
      .select({
        value: countInt,
        pending: sql<number>`coalesce(sum(case when ${orders.status} = 'pending' then 1 else 0 end), 0)::int`,
        totalCents: sql<number>`coalesce(sum(case when ${orders.status} = 'cancelled' then 0 else ${orders.totalCents} end), 0)::int`,
      })
      .from(orders),

    db
      .select({ value: countInt })
      .from(contactMessages)
      .where(eq(contactMessages.status, 'new')),

    db
      .select({
        stageId: stages.id,
        number: stages.number,
        titleAr: stages.titleAr,
        titleEn: stages.titleEn,
        accent: stages.accent,
        studentCount: sql<number>`count(distinct ${studentStageAccess.studentId})::int`,
        lessonCount: sql<number>`(
          select count(*)::int from ${lessons}
          where ${lessons.stageId} = ${stages.id} and ${lessons.isPublished} = true
        )`,
      })
      .from(stages)
      .leftJoin(
        studentStageAccess,
        and(
          eq(studentStageAccess.stageId, stages.id),
          eq(studentStageAccess.isRevoked, false),
        ),
      )
      .groupBy(stages.id, stages.number, stages.titleAr, stages.titleEn, stages.accent)
      .orderBy(stages.number),

    db
      .select({
        codeId: activationCodes.id,
        studentId: activationCodes.studentId,
        studentName: students.name,
        stageNumber: stages.number,
        stageTitleAr: stages.titleAr,
        stageTitleEn: stages.titleEn,
        activatedAt: activationCodes.activatedAt,
      })
      .from(activationCodes)
      .innerJoin(stages, eq(activationCodes.stageId, stages.id))
      .leftJoin(students, eq(activationCodes.studentId, students.id))
      .where(eq(activationCodes.status, 'activated'))
      .orderBy(desc(activationCodes.activatedAt))
      .limit(8),

    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        totalCents: orders.totalCents,
        currency: orders.currency,
        status: orders.status,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(8),
  ]);

  const byStatus = new Map(codeStatusRows.map((row) => [row.status, Number(row.value)]));
  const accessibleLessons = Number(progressRows[0]?.accessible ?? 0);
  const completedLessons = Number(progressRows[0]?.completed ?? 0);

  return {
    counters: {
      totalStudents: Number(studentRows[0]?.value ?? 0),
      activatedStudents: Number(activatedStudentRows[0]?.value ?? 0),
      unusedCodes: byStatus.get('unused') ?? 0,
      activatedCodes: byStatus.get('activated') ?? 0,
      revokedCodes: byStatus.get('revoked') ?? 0,
      stagesCompleted: Number(stageCompletionRows[0]?.value ?? 0),
      averageProgress: percentage(completedLessons, accessibleLessons),
      totalProducts: Number(productRows[0]?.value ?? 0),
      totalOrders: Number(orderRows[0]?.value ?? 0),
      pendingOrders: Number(orderRows[0]?.pending ?? 0),
      newMessages: Number(messageRows[0]?.value ?? 0),
      orderValueCents: Number(orderRows[0]?.totalCents ?? 0),
    },
    stageBreakdown: stageBreakdown.map((row) => ({
      ...row,
      studentCount: Number(row.studentCount),
      lessonCount: Number(row.lessonCount),
    })),
    recentActivations,
    recentOrders,
  };
}
