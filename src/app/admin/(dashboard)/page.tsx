import Link from 'next/link';
import { getAdminLocaleContext } from '@/lib/admin/context';
import { getOverviewData } from '@/lib/admin/stats';
import { redirectIfStaff } from '@/lib/auth/admin-pages';
import { formatDateTime, formatNumber, formatPrice } from '@/lib/utils';
import { getSiteSettings } from '@/lib/settings';

export const metadata = { title: 'Overview' };

export default async function AdminOverviewPage() {
  await redirectIfStaff();
  const { locale, dict } = await getAdminLocaleContext();
  const [data, settings] = await Promise.all([getOverviewData(), getSiteSettings()]);
  const c = data.counters;

  const cards = [
    { label: dict.overview.totalStudents, value: formatNumber(c.totalStudents, locale) },
    { label: dict.overview.activatedStudents, value: formatNumber(c.activatedStudents, locale) },
    { label: dict.overview.unusedCodes, value: formatNumber(c.unusedCodes, locale) },
    { label: dict.overview.activatedCodes, value: formatNumber(c.activatedCodes, locale) },
    { label: dict.overview.completedStages, value: formatNumber(c.stagesCompleted, locale) },
    { label: dict.overview.averageProgress, value: `${formatNumber(c.averageProgress, locale)}%` },
    { label: dict.overview.totalProducts, value: formatNumber(c.totalProducts, locale) },
    { label: dict.overview.totalOrders, value: formatNumber(c.totalOrders, locale) },
    { label: dict.overview.pendingOrders, value: formatNumber(c.pendingOrders, locale) },
    { label: dict.overview.newMessages, value: formatNumber(c.newMessages, locale) },
    { label: dict.overview.revenue, value: formatPrice(c.orderValueCents, settings.store.currency, locale) },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">{dict.overview.title}</h1>
        <p className="mt-2 text-[var(--foreground-muted)]">{dict.overview.subtitle}</p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => (
          <li key={card.label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
              {card.label}
            </p>
            <p className="latin mt-3 text-2xl font-extrabold tracking-tight">{card.value}</p>
          </li>
        ))}
      </ul>

      <section>
        <h2 className="text-lg font-bold">{dict.overview.studentsPerStage}</h2>
        {data.stageBreakdown.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--foreground-muted)]">{dict.overview.noStages}</p>
        ) : (
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {data.stageBreakdown.map((stage) => (
              <li key={stage.stageId} className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3">
                <span className="font-semibold">
                  {locale === 'ar' ? stage.titleAr : stage.titleEn}
                </span>
                <span className="latin text-sm text-[var(--foreground-muted)]">
                  {formatNumber(stage.studentCount, locale)} {dict.overview.studentsUnit}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">{dict.overview.recentActivations}</h2>
            <Link href="/admin/codes" className="text-sm font-semibold text-[var(--accent)]">
              {dict.overview.viewAll}
            </Link>
          </div>
          {data.recentActivations.length === 0 ? (
            <p className="text-sm text-[var(--foreground-muted)]">{dict.overview.noRecentActivity}</p>
          ) : (
            <ul className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)]">
              {data.recentActivations.map((row) => (
                <li key={row.codeId} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="font-medium">{row.studentName ?? '—'}</span>
                  <span className="text-[var(--foreground-muted)]">
                    {locale === 'ar' ? row.stageTitleAr : row.stageTitleEn}
                  </span>
                  <span className="latin text-xs text-[var(--foreground-subtle)]">
                    {formatDateTime(row.activatedAt, locale)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">{dict.overview.recentOrders}</h2>
            <Link href="/admin/orders" className="text-sm font-semibold text-[var(--accent)]">
              {dict.overview.viewAll}
            </Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <p className="text-sm text-[var(--foreground-muted)]">{dict.overview.noRecentActivity}</p>
          ) : (
            <ul className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)]">
              {data.recentOrders.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="latin font-medium">{row.orderNumber}</span>
                  <span>{row.customerName}</span>
                  <span className="latin">{formatPrice(row.totalCents, row.currency, locale)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
