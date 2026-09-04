import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductForm } from '@/components/admin/product-form';
import { getAdminProduct, listAdminCategories } from '@/lib/admin/catalog';
import { getAdminLocaleContext } from '@/lib/admin/context';

export const metadata = { title: 'Edit product' };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { dict } = await getAdminLocaleContext();
  const [product, categories] = await Promise.all([getAdminProduct(id), listAdminCategories()]);
  if (!product) notFound();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link href="/admin/products" className="text-sm font-semibold text-[var(--accent)]">
        ← {dict.products.backToList}
      </Link>
      <h1 className="text-3xl font-extrabold tracking-tight">{dict.products.edit}</h1>
      <ProductForm dict={dict} product={product} categories={categories} />
    </div>
  );
}
