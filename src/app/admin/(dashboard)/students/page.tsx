import Link from 'next/link';
import { AdminPager } from '@/components/admin/pager';
import { Badge } from '@/components/ui/badge';
import { getAdminLocaleContext } from '@/lib/admin/context';
import { DEFAULT_PAGE_SIZE, readEnum, readPage, readParam } from '@/lib/admin/pagination';
import { listStudents } from '@/lib/admin/students';
import { formatDate, formatNumber } from '@/lib/utils';
import { redirectIfStaff } from '@/lib/auth/admin-pages';

export const metadata = { title: 'Students' };

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await redirectIfStaff();
  const params = await searchParams;
  const { locale, dict } = await getAdminLocaleContext();
  const filters = {
    page: readPage(params),
    pageSize: DEFAULT_PAGE_SIZE,
    search: readParam(params, 'q') || undefined,
    status: readEnum(params, 'status', ['active', 'inactive'] as const),
  };
  const { rows, pageInfo } = await listStudents(filters);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">{dict.students.title}</h1>
        <p className="mt-2 text-[var(--foreground-muted)]">{dict.students.subtitle}</p>
      </div>

      <form className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={filters.search}
          placeholder={dict.students.searchPlaceholder}
          className="min-w-56 flex-1 rounded-xl border border-[var(--border-strong)] bg-transparent px-3 py-2 text-sm"
        />
        <select name="status" defaultValue={filters.status ?? ''} className="rounded-xl border border-[var(--border-strong)] bg-transparent px-3 py-2 text-sm">
          <option value="">{dict.students.filterStatus}</option>
          <option value="active">{dict.students.active}</option>
          <option value="inactive">{dict.students.inactive}</option>
        </select>
        <button type="submit" className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-[var(--background)]">
          {dict.common.apply}
        </button>
      </form>

      {rows.length === 0 ? (
        <p className="text-[var(--foreground-muted)]">{dict.students.empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
          <table className="w-full min-w-[800px] text-start text-sm">
            <thead className="bg-[var(--surface-sunken)] text-xs uppercase tracking-[0.08em] text-[var(--foreground-subtle)]">
              <tr>
                <th className="px-4 py-3">{dict.students.columnName}</th>
                <th className="px-4 py-3">{dict.students.columnStages}</th>
                <th className="px-4 py-3">{dict.students.columnProgress}</th>
                <th className="px-4 py-3">{dict.students.columnLastActivity}</th>
                <th className="px-4 py-3">{dict.students.columnStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/students/${row.id}`} className="font-semibold hover:text-[var(--accent)]">
                      {row.name}
                    </Link>
                  </td>
                  <td className="latin px-4 py-3">{row.stageLabels || '—'}</td>
                  <td className="latin px-4 py-3">
                    {formatNumber(row.progressPercent, locale)}% · {row.completedLessons}/{row.totalLessons}
                  </td>
                  <td className="px-4 py-3 text-[var(--foreground-muted)]">{formatDate(row.lastSeenAt, locale)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={row.isActive ? 'success' : 'danger'}>
                      {row.isActive ? dict.students.active : dict.students.inactive}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminPager pageInfo={pageInfo} basePath="/admin/students" values={{ q: filters.search, status: filters.status }} dict={dict} />
    </div>
  );
}
