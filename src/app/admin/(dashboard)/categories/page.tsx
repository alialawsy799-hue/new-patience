import { CategoriesManager } from '@/components/admin/categories-manager';
import { listAdminCategories } from '@/lib/admin/catalog';
import { getAdminLocaleContext } from '@/lib/admin/context';

export const metadata = { title: 'Categories' };

export default async function AdminCategoriesPage() {
  const { dict } = await getAdminLocaleContext();
  const categories = await listAdminCategories();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">{dict.categories.title}</h1>
        <p className="mt-2 text-[var(--foreground-muted)]">{dict.categories.subtitle}</p>
      </div>
      <CategoriesManager dict={dict} categories={categories} />
    </div>
  );
}
