import { ProductStockButton } from '@/components/admin/product-stock-button';
import { QuickProductForm } from '@/components/admin/quick-product-form';
import { listAdminProducts } from '@/lib/admin/catalog';
import { getAdminLocaleContext } from '@/lib/admin/context';

export const metadata = { title: 'Add products' };

export default async function AddProductsPage() {
  const { locale, dict } = await getAdminLocaleContext();
  const { rows } = await listAdminProducts({ page: 1, pageSize: 80 });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">{dict.products.addTabTitle}</h1>
        <p className="mt-2 text-[var(--foreground-muted)]">{dict.products.addTabSubtitle}</p>
      </div>

      <QuickProductForm dict={dict} />

      {rows.length === 0 ? (
        <p>{dict.products.empty}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => {
            const name = locale === 'ar' ? row.nameAr : row.nameEn;
            const image = row.images[0];
            return (
              <li
                key={row.id}
                className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] p-4"
              >
                <div className="relative aspect-square overflow-hidden rounded-xl bg-white">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt="" className="size-full object-contain p-4" />
                  ) : (
                    <div className="grid size-full place-items-center text-sm text-[var(--foreground-subtle)]">
                      {dict.products.noImage}
                    </div>
                  )}
                </div>
                <p className="font-bold">{name}</p>
                <ProductStockButton productId={row.id} stock={row.stock} dict={dict} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
