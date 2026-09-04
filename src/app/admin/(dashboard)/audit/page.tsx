import { AdminPager } from '@/components/admin/pager';
import { listAuditLogs } from '@/lib/admin/catalog';
import { getAdminLocaleContext } from '@/lib/admin/context';
import { DEFAULT_PAGE_SIZE, readPage, readParam } from '@/lib/admin/pagination';
import { formatDateTime } from '@/lib/utils';
import { redirectIfStaff } from '@/lib/auth/admin-pages';

export const metadata = { title: 'Audit log' };

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await redirectIfStaff();
  const params = await searchParams;
  const { locale, dict } = await getAdminLocaleContext();
  const action = readParam(params, 'action') || undefined;
  const { rows, pageInfo } = await listAuditLogs({
    page: readPage(params),
    pageSize: DEFAULT_PAGE_SIZE,
    action,
  });

  const actorLabel = (type: string) => {
    if (type === 'admin') return dict.audit.actorAdmin;
    if (type === 'student') return dict.audit.actorStudent;
    if (type === 'system') return dict.audit.actorSystem;
    return dict.audit.actorAnonymous;
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">{dict.audit.title}</h1>
        <p className="mt-2 text-[var(--foreground-muted)]">{dict.audit.subtitle}</p>
      </div>
      <form className="flex flex-wrap gap-3">
        <input
          name="action"
          defaultValue={action}
          placeholder={dict.audit.filterAction}
          className="latin min-w-56 flex-1 rounded-xl border border-[var(--border-strong)] bg-transparent px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-[var(--background)]">
          {dict.common.apply}
        </button>
      </form>
      {rows.length === 0 ? (
        <p>{dict.audit.empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
          <table className="w-full min-w-[800px] text-start text-sm">
            <thead className="bg-[var(--surface-sunken)] text-xs uppercase text-[var(--foreground-subtle)]">
              <tr>
                <th className="px-4 py-3">{dict.audit.columnTime}</th>
                <th className="px-4 py-3">{dict.audit.columnActor}</th>
                <th className="px-4 py-3">{dict.audit.columnAction}</th>
                <th className="px-4 py-3">{dict.audit.columnEntity}</th>
                <th className="px-4 py-3">{dict.audit.columnIp}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="latin px-4 py-3 text-[var(--foreground-muted)]">{formatDateTime(row.createdAt, locale)}</td>
                  <td className="px-4 py-3">
                    {row.actorLabel || actorLabel(row.actorType)}
                  </td>
                  <td className="latin px-4 py-3 font-semibold">{row.action}</td>
                  <td className="latin px-4 py-3 text-[var(--foreground-muted)]">{row.entityType}</td>
                  <td className="latin px-4 py-3 text-[var(--foreground-subtle)]">{row.ipAddress ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <AdminPager pageInfo={pageInfo} basePath="/admin/audit" values={{ action }} dict={dict} />
    </div>
  );
}
