import Link from 'next/link';
import { listStagesForAdmin } from '@/lib/admin/content';
import { getAdminLocaleContext } from '@/lib/admin/context';
import { Badge } from '@/components/ui/badge';
import { interpolate } from '@/lib/i18n';
import { redirectIfStaff } from '@/lib/auth/admin-pages';

export const metadata = { title: 'Courses' };

export default async function AdminCoursesPage() {
  await redirectIfStaff();
  const { locale, dict } = await getAdminLocaleContext();
  const stages = await listStagesForAdmin();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">{dict.courses.title}</h1>
        <p className="mt-2 text-[var(--foreground-muted)]">{dict.courses.subtitle}</p>
      </div>
      {stages.length === 0 ? (
        <p>{dict.courses.empty}</p>
      ) : (
        <ul className="grid gap-4">
          {stages.map((stage) => (
            <li key={stage.id}>
              <Link
                href={`/admin/courses/${stage.id}`}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:border-[var(--border-strong)]"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
                    {interpolate(dict.courses.stageNumber, { number: stage.number })}
                  </p>
                  <h2 className="mt-1 text-xl font-extrabold">
                    {locale === 'ar' ? stage.titleAr : stage.titleEn}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[var(--foreground-muted)]">
                    {interpolate(dict.courses.lessonCount, { count: stage.lessonCount })}
                  </span>
                  <Badge tone={stage.isPublished ? 'success' : 'neutral'}>
                    {stage.isPublished ? dict.courses.published : dict.courses.unpublished}
                  </Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
