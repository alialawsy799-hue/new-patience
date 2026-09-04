import { AdminPager } from '@/components/admin/pager';
import { MessageStatusButtons } from '@/components/admin/message-status';
import { Badge } from '@/components/ui/badge';
import { listAdminMessages } from '@/lib/admin/catalog';
import { getAdminLocaleContext } from '@/lib/admin/context';
import { DEFAULT_PAGE_SIZE, readEnum, readPage, readParam } from '@/lib/admin/pagination';
import type { MessageStatus } from '@/lib/db/schema';
import { formatDateTime } from '@/lib/utils';
import { redirectIfStaff } from '@/lib/auth/admin-pages';

export const metadata = { title: 'Messages' };

const statuses = ['new', 'read', 'archived'] as const;

export default async function AdminMessagesPage({
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
    status: readEnum<MessageStatus>(params, 'status', statuses),
  };
  const { rows, pageInfo } = await listAdminMessages(filters);
  const labels: Record<string, string> = {
    new: dict.messages.statusNew,
    read: dict.messages.statusRead,
    archived: dict.messages.statusArchived,
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">{dict.messages.title}</h1>
        <p className="mt-2 text-[var(--foreground-muted)]">{dict.messages.subtitle}</p>
      </div>
      <form className="flex flex-wrap gap-3">
        <input name="q" defaultValue={filters.search} placeholder={dict.messages.searchPlaceholder} className="min-w-56 flex-1 rounded-xl border border-[var(--border-strong)] bg-transparent px-3 py-2 text-sm" />
        <select name="status" defaultValue={filters.status ?? ''} className="rounded-xl border border-[var(--border-strong)] bg-transparent px-3 py-2 text-sm">
          <option value="">{dict.messages.filterStatus}</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {labels[status]}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-[var(--background)]">
          {dict.common.apply}
        </button>
      </form>
      {rows.length === 0 ? (
        <p>{dict.messages.empty}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map((row) => (
            <li key={row.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{row.name}</p>
                  <p className="latin text-sm text-[var(--foreground-muted)]">{row.email}</p>
                </div>
                <Badge tone={row.status === 'new' ? 'accent' : 'neutral'}>{labels[row.status]}</Badge>
              </div>
              <p className="mt-3 text-sm font-semibold">{row.subject || dict.messages.noSubject}</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[var(--foreground-muted)]">{row.message}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="latin text-xs text-[var(--foreground-subtle)]">{formatDateTime(row.createdAt, locale)}</span>
                <MessageStatusButtons id={row.id} status={row.status} dict={dict} />
              </div>
            </li>
          ))}
        </ul>
      )}
      <AdminPager pageInfo={pageInfo} basePath="/admin/messages" values={{ q: filters.search, status: filters.status }} dict={dict} />
    </div>
  );
}
