import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StudentActions } from '@/components/admin/student-actions';
import { Badge } from '@/components/ui/badge';
import { listStageOptions } from '@/lib/admin/content';
import { getAdminLocaleContext } from '@/lib/admin/context';
import { getStudentDetail } from '@/lib/admin/students';
import { formatDate, formatDateTime, formatNumber } from '@/lib/utils';
import { redirectIfStaff } from '@/lib/auth/admin-pages';

export const metadata = { title: 'Student' };

export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await redirectIfStaff();
  const { id } = await params;
  const { locale, dict } = await getAdminLocaleContext();
  const detail = await getStudentDetail(id);
  if (!detail) notFound();
  const stages = await listStageOptions();
  const { student, access, codes } = detail;
  const held = access.filter((row) => !row.isRevoked).map((row) => row.stageId);

  const titleLabel =
    student.title === 'doctor_male'
      ? dict.students.titleDoctorMale
      : student.title === 'doctor_female'
        ? dict.students.titleDoctorFemale
        : dict.students.titleNone;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <Link href="/admin/students" className="text-sm font-semibold text-[var(--accent)]">
        ← {dict.students.backToList}
      </Link>
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">{student.name}</h1>
        <p className="mt-2 text-[var(--foreground-muted)]">
          {titleLabel} · {dict.students.joined} {formatDate(student.createdAt, locale)}
        </p>
        <Badge className="mt-3" tone={student.isActive ? 'success' : 'danger'}>
          {student.isActive ? dict.students.active : dict.students.inactive}
        </Badge>
      </div>

      <StudentActions
        studentId={student.id}
        isActive={student.isActive}
        stages={stages}
        heldStageIds={held}
        dict={dict}
      />

      <section>
        <h2 className="text-lg font-bold">{dict.students.progressByStage}</h2>
        {access.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--foreground-muted)]">{dict.students.noAccess}</p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)]">
            {access.map((row) => (
              <li key={row.stageId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="font-semibold">
                  {row.stageNumber}. {locale === 'ar' ? row.titleAr : row.titleEn}
                </span>
                <span className="latin text-[var(--foreground-muted)]">
                  {formatNumber(row.progressPercent, locale)}% · {row.completedLessons}/{row.totalLessons}
                </span>
                {row.isRevoked ? <Badge tone="danger">{dict.students.stageRevoked}</Badge> : null}
                {row.isCompleted ? (
                  <span className="text-xs text-[var(--success)]">
                    {dict.students.completedOn} {formatDate(row.completedAt, locale)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold">{dict.students.codesUsed}</h2>
        {codes.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--foreground-muted)]">{dict.students.noCodes}</p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)]">
            {codes.map((code) => (
              <li key={code.id} className="flex justify-between px-4 py-3 text-sm">
                <span className="latin font-semibold">••••{code.codeHint}</span>
                <span>{dict.codes.stage} {code.stageNumber}</span>
                <span className="latin text-[var(--foreground-subtle)]">{formatDateTime(code.activatedAt, locale)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
