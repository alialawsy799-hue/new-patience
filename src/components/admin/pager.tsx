import Link from 'next/link';
import type { PageInfo } from '@/lib/admin/pagination';
import { pageHref } from '@/lib/admin/pagination';
import type { AdminDictionary } from '@/lib/i18n/admin';
import { interpolate } from '@/lib/i18n';

export function AdminPager({
  pageInfo,
  basePath,
  values,
  dict,
}: {
  pageInfo: PageInfo;
  basePath: string;
  values: Record<string, string | number | undefined>;
  dict: AdminDictionary;
}) {
  if (pageInfo.total === 0) return null;

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-[var(--foreground-muted)]">
        {interpolate(dict.common.showing, {
          from: pageInfo.from,
          to: pageInfo.to,
          total: pageInfo.total,
        })}
      </p>
      {pageInfo.pages > 1 ? (
        <div className="flex items-center gap-2">
          {pageInfo.page > 1 ? (
            <Link
              href={pageHref(basePath, values, pageInfo.page - 1)}
              className="rounded-full border border-[var(--border)] px-3 py-1.5 font-semibold"
            >
              {dict.common.previous}
            </Link>
          ) : null}
          <span className="text-[var(--foreground-subtle)]">
            {interpolate(dict.common.page, { page: pageInfo.page, pages: pageInfo.pages })}
          </span>
          {pageInfo.page < pageInfo.pages ? (
            <Link
              href={pageHref(basePath, values, pageInfo.page + 1)}
              className="rounded-full border border-[var(--border)] px-3 py-1.5 font-semibold"
            >
              {dict.common.next}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
