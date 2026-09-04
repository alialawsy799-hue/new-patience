import Link from 'next/link';
import { AdminPager } from '@/components/admin/pager';
import { ProductStockButton } from '@/components/admin/product-stock-button';
import { Badge } from '@/components/ui/badge';
import { listAdminCategories, listAdminProducts } from '@/lib/admin/catalog';
import { getAdminLocaleContext } from '@/lib/admin/context';
import { DEFAULT_PAGE_SIZE, readPage, readParam } from '@/lib/admin/pagination';
import { formatPrice } from '@/lib/utils';

export const metadata = { title: 'Products' };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { locale, dict } = await getAdminLocaleContext();
  const categories = await listAdminCategories();
  const filters = {
    page: readPage(params),
    pageSize: DEFAULT_PAGE_SIZE,
    search: readParam(params, 'q') || undefined,
    categoryId: readParam(params, 'categoryId') || undefined,
  };
  const { rows, pageInfo } = await listAdminProducts(filters);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{dict.products.title}</h1>
          <p className="mt-2 text-[var(--foreground-muted)]">{dict.products.subtitle}</p>
        </div>
        <Link href="/admin/products/new" className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--accent-foreground)]">
          {dict.products.add}
        </Link>
      </div>

      <form className="flex flex-wrap gap-3">
        <input name="q" defaultValue={filters.search} placeholder={dict.products.searchPlaceholder} className="min-w-56 flex-1 rounded-xl border border-[var(--border-strong)] bg-transparent px-3 py-2 text-sm" />
        <select name="categoryId" defaultValue={filters.categoryId ?? ''} className="rounded-xl border border-[var(--border-strong)] bg-transparent px-3 py-2 text-sm">
          <option value="">{dict.products.filterCategory}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {locale === 'ar' ? category.nameAr : category.nameEn}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-[var(--background)]">
          {dict.common.apply}
        </button>
      </form>

      {rows.length === 0 ? (
        <p>{dict.products.empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
          <table className="w-full min-w-[720px] text-start text-sm">
            <thead className="bg-[var(--surface-sunken)] text-xs uppercase text-[var(--foreground-subtle)]">
              <tr>
                <th className="px-4 py-3">{dict.products.columnName}</th>
                <th className="px-4 py-3">{dict.products.columnCategory}</th>
                <th className="px-4 py-3">{dict.products.columnPrice}</th>
                <th className="px-4 py-3">{dict.products.columnStock}</th>
                <th className="px-4 py-3">{dict.products.columnStatus}</th>
                <th className="px-4 py-3">{dict.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${row.id}`} className="font-semibold hover:text-[var(--accent)]">
                      {locale === 'ar' ? row.nameAr : row.nameEn}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--foreground-muted)]">
                    {(locale === 'ar' ? row.categoryNameAr : row.categoryNameEn) ?? dict.products.noCategory}
                  </td>
                  <td className="latin px-4 py-3">{formatPrice(row.priceCents, row.currency, locale)}</td>
                  <td className="latin px-4 py-3">{row.stock}</td>
                  <td className="px-4 py-3">
                    <Badge tone={!row.isActive ? 'neutral' : row.stock <= 0 ? 'danger' : 'success'}>
                      {!row.isActive ? dict.products.hidden : row.stock <= 0 ? dict.products.outOfStock : dict.products.active}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <ProductStockButton productId={row.id} stock={row.stock} dict={dict} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <AdminPager pageInfo={pageInfo} basePath="/admin/products" values={{ q: filters.search, categoryId: filters.categoryId }} dict={dict} />
    </div>
  );
}
