import { CodesToolbar, CopyCodeButton, RevokeButton } from '@/components/admin/codes-actions';
import { AdminPager } from '@/components/admin/pager';
import { Badge } from '@/components/ui/badge';
import { listCodes } from '@/lib/admin/codes';
import { listStageOptions } from '@/lib/admin/content';
import { getAdminLocaleContext } from '@/lib/admin/context';
import { readEnum, readPage, readParam } from '@/lib/admin/pagination';
import type { CodeStatus } from '@/lib/db/schema';
import { formatDateTime } from '@/lib/utils';

export const metadata = { title: 'Access codes' };

const statuses = ['unused', 'activated', 'revoked'] as const;

export default async function AdminCodesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { locale, dict } = await getAdminLocaleContext();
  const stages = await listStageOptions();
  const filters = {
    page: readPage(params),
    pageSize: 250,
    stageId: readParam(params, 'stageId') || undefined,
    status: readEnum<CodeStatus>(params, 'status', statuses),
    search: readParam(params, 'q') || undefined,
  };
  const { rows, pageInfo } = await listCodes(filters);

  const statusTone: Record<string, 'neutral' | 'success' | 'danger'> = {
    unused: 'success',
    activated: 'danger',
    revoked: 'neutral',
  };
  const statusLabel: Record<string, string> = {
    unused: dict.codes.statusUnused,
    activated: dict.codes.statusActivated,
    revoked: dict.codes.statusRevoked,
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{dict.codes.title}</h1>
          <p className="mt-2 text-[var(--foreground-muted)]">{dict.codes.subtitle}</p>
        </div>
        <CodesToolbar dict={dict} stages={stages} />
      </div>

      <p className="text-sm text-[var(--foreground-subtle)]">{dict.codes.hidden}</p>
      <p className="text-sm text-[var(--warning)]">{dict.codes.exportWarning}</p>

      <form className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:grid-cols-4">
        <input
          name="q"
          defaultValue={filters.search}
          placeholder={dict.codes.searchPlaceholder}
          className="rounded-xl border border-[var(--border-strong)] bg-transparent px-3 py-2 text-sm sm:col-span-2"
        />
        <select name="stageId" defaultValue={filters.stageId ?? ''} className="rounded-xl border border-[var(--border-strong)] bg-transparent px-3 py-2 text-sm">
          <option value="">{dict.codes.filterStage}</option>
          {stages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.number}. {locale === 'ar' ? stage.titleAr : stage.titleEn}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={filters.status ?? ''} className="rounded-xl border border-[var(--border-strong)] bg-transparent px-3 py-2 text-sm">
          <option value="">{dict.codes.filterStatus}</option>
          <option value="unused">{dict.codes.statusUnused}</option>
          <option value="activated">{dict.codes.statusActivated}</option>
          <option value="revoked">{dict.codes.statusRevoked}</option>
        </select>
        <button type="submit" className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-[var(--background)] sm:col-span-4 sm:w-fit">
          {dict.common.apply}
        </button>
      </form>

      {rows.length === 0 ? (
        <p className="text-[var(--foreground-muted)]">{filters.search || filters.status ? dict.codes.empty : dict.codes.emptyAll}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
          <table className="w-full min-w-[720px] text-start text-sm">
            <thead className="bg-[var(--surface-sunken)] text-xs uppercase tracking-[0.08em] text-[var(--foreground-subtle)]">
              <tr>
                <th className="px-4 py-3 font-semibold">{dict.codes.columnCode}</th>
                <th className="px-4 py-3 font-semibold">{dict.codes.columnStage}</th>
                <th className="px-4 py-3 font-semibold">{dict.codes.columnStatus}</th>
                <th className="px-4 py-3 font-semibold">{dict.codes.columnStudent}</th>
                <th className="px-4 py-3 font-semibold">{dict.codes.columnActivated}</th>
                <th className="px-4 py-3 font-semibold">{dict.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {rows.map((row) => (
                <tr key={row.id} className={row.status === 'activated' ? 'bg-[var(--danger-muted)]' : undefined}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="latin font-semibold tracking-wide">{row.code}</span>
                      <CopyCodeButton code={row.code} label={dict.codes.copyCode} copiedLabel={dict.codes.copied} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {row.stageNumber}. {locale === 'ar' ? row.stageTitleAr : row.stageTitleEn}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone[row.status] ?? 'neutral'}>
                      {statusLabel[row.status] ?? row.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{row.studentName ?? '—'}</td>
                  <td className="latin px-4 py-3 text-[var(--foreground-muted)]">
                    {formatDateTime(row.activatedAt, locale)}
                  </td>
                  <td className="px-4 py-3">
                    {row.status !== 'revoked' ? <RevokeButton codeId={row.id} dict={dict} /> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminPager
        pageInfo={pageInfo}
        basePath="/admin/codes"
        values={{ q: filters.search, stageId: filters.stageId, status: filters.status }}
        dict={dict}
      />
    </div>
  );
}
