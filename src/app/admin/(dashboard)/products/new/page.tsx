import Link from 'next/link';
import { ProductForm } from '@/components/admin/product-form';
import { listAdminCategories } from '@/lib/admin/catalog';
import { getAdminLocaleContext } from '@/lib/admin/context';

export const metadata = { title: 'New product' };

export default async function NewProductPage() {
  const { dict } = await getAdminLocaleContext();
  const categories = await listAdminCategories();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link href="/admin/products" className="text-sm font-semibold text-[var(--accent)]">
        ← {dict.products.backToList}
      </Link>
      <h1 className="text-3xl font-extrabold tracking-tight">{dict.products.add}</h1>
      <ProductForm dict={dict} categories={categories} />
    </div>
  );
}
