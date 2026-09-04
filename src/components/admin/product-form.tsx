'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SelectField, TextAreaField, TextField } from '@/components/ui/field';
import { Alert } from '@/components/ui/states';
import { centsToInput, parseMoneyToCents } from '@/lib/admin/money';
import type { AdminDictionary } from '@/lib/i18n/admin';
import type { Product, ProductCategory } from '@/lib/db/schema';

export function ProductForm({
  dict,
  product,
  categories,
}: {
  dict: AdminDictionary;
  product?: Product;
  categories: Pick<ProductCategory, 'id' | 'nameAr' | 'nameEn'>[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const priceCents = parseMoneyToCents(String(form.get('price') ?? ''));
    const compare = String(form.get('compareAt') ?? '').trim();
    const compareAtPriceCents = compare ? parseMoneyToCents(compare) : null;
    if (priceCents === null || (compare && compareAtPriceCents === null)) {
      setError(dict.products.priceHint);
      setPending(false);
      return;
    }

    const body = {
      nameAr: form.get('nameAr'),
      nameEn: form.get('nameEn'),
      slug: String(form.get('slug') ?? '') || undefined,
      categoryId: String(form.get('categoryId') || '') || null,
      shortDescriptionAr: form.get('shortDescriptionAr'),
      shortDescriptionEn: form.get('shortDescriptionEn'),
      descriptionAr: form.get('descriptionAr'),
      descriptionEn: form.get('descriptionEn'),
      priceCents,
      compareAtPriceCents,
      currency: form.get('currency'),
      stock: Number(form.get('stock') || 0),
      images: String(form.get('images') ?? '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      isActive: form.get('isActive') === 'on',
      isFeatured: form.get('isFeatured') === 'on',
      isNew: form.get('isNew') === 'on',
      comingSoon: form.get('comingSoon') === 'on',
      sortOrder: Number(form.get('sortOrder') || 0),
    };

    const response = await fetch(product ? `/api/admin/products/${product.id}` : '/api/admin/products', {
      method: product ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => null)) as { id?: string; error?: string } | null;
    setPending(false);
    if (!response.ok) {
      setError(payload?.error === 'slug_taken' ? dict.products.slugHint : dict.common.saveFailed);
      return;
    }
    router.push(product ? '/admin/products' : `/admin/products/${payload?.id ?? ''}`);
    router.refresh();
  }

  async function remove() {
    if (!product || !window.confirm(dict.products.deleteBody)) return;
    await fetch(`/api/admin/products/${product.id}`, { method: 'DELETE', credentials: 'same-origin' });
    router.push('/admin/products');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="nameAr" label={dict.products.nameAr} defaultValue={product?.nameAr} required />
        <TextField name="nameEn" label={dict.products.nameEn} defaultValue={product?.nameEn} required />
      </div>
      <TextField name="slug" label={dict.products.slug} hint={dict.products.slugHint} defaultValue={product?.slug} className="latin" dir="ltr" />
      <SelectField name="categoryId" label={dict.products.category} defaultValue={product?.categoryId ?? ''}>
        <option value="">{dict.products.noCategory}</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.nameEn}
          </option>
        ))}
      </SelectField>
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField name="price" label={dict.products.price} hint={dict.products.priceHint} defaultValue={centsToInput(product?.priceCents ?? 0)} required className="latin" dir="ltr" />
        <TextField name="compareAt" label={dict.products.compareAtPrice} defaultValue={product?.compareAtPriceCents ? centsToInput(product.compareAtPriceCents) : ''} className="latin" dir="ltr" />
        <TextField name="currency" label={dict.products.currency} defaultValue={product?.currency ?? 'IQD'} className="latin" dir="ltr" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="stock" type="number" min={0} label={dict.products.stock} defaultValue={product?.stock ?? 0} />
        <TextField name="sortOrder" type="number" min={0} label={dict.products.sortOrder} defaultValue={product?.sortOrder ?? 0} />
      </div>
      <TextAreaField name="shortDescriptionAr" label={dict.products.shortDescriptionAr} defaultValue={product?.shortDescriptionAr} />
      <TextAreaField name="shortDescriptionEn" label={dict.products.shortDescriptionEn} defaultValue={product?.shortDescriptionEn} />
      <TextAreaField name="descriptionAr" label={dict.products.descriptionAr} defaultValue={product?.descriptionAr} />
      <TextAreaField name="descriptionEn" label={dict.products.descriptionEn} defaultValue={product?.descriptionEn} />
      <TextAreaField
        name="images"
        label={dict.products.images}
        hint={dict.products.imagesHint}
        defaultValue={product?.images.join('\n')}
        className="latin"
        dir="ltr"
      />
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" name="isActive" defaultChecked={product?.isActive ?? true} />
        {dict.products.active}
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" name="isFeatured" defaultChecked={product?.isFeatured} />
        {dict.products.featured}
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" name="isNew" defaultChecked={product?.isNew} />
        {dict.products.isNew}
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" name="comingSoon" defaultChecked={product?.comingSoon} />
        {dict.products.comingSoon}
      </label>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={pending}>
          {dict.common.save}
        </Button>
        {product ? (
          <Button type="button" variant="danger" onClick={() => void remove()}>
            {dict.common.delete}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
