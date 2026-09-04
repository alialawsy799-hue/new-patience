'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import type { AdminDictionary } from '@/lib/i18n/admin';
import type { ProductCategory } from '@/lib/db/schema';

export function CategoriesManager({
  dict,
  categories,
}: {
  dict: AdminDictionary;
  categories: (ProductCategory & { productCount: number })[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        nameAr: form.get('nameAr'),
        nameEn: form.get('nameEn'),
        slug: form.get('slug'),
        descriptionAr: form.get('descriptionAr'),
        descriptionEn: form.get('descriptionEn'),
      }),
    });
    event.currentTarget.reset();
    setPending(false);
    router.refresh();
  }

  async function save(id: string, form: HTMLFormElement) {
    const data = new FormData(form);
    await fetch('/api/admin/categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        id,
        nameAr: data.get('nameAr'),
        nameEn: data.get('nameEn'),
        slug: data.get('slug'),
        isActive: data.get('isActive') === 'on',
      }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    if (!window.confirm(dict.categories.deleteBody)) return;
    await fetch('/api/admin/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={create} className="grid gap-3 rounded-2xl border border-dashed border-[var(--border-strong)] p-5">
        <h2 className="font-bold">{dict.categories.add}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField name="nameAr" label={dict.categories.nameAr} required />
          <TextField name="nameEn" label={dict.categories.nameEn} required />
        </div>
        <TextField name="slug" label={dict.categories.slug} className="latin" dir="ltr" />
        <Button type="submit" loading={pending}>
          {dict.categories.add}
        </Button>
      </form>

      {categories.length === 0 ? <p>{dict.categories.empty}</p> : null}
      {categories.map((category) => (
        <form
          key={category.id}
          className="grid gap-3 rounded-2xl border border-[var(--border)] p-5"
          onSubmit={(event) => {
            event.preventDefault();
            void save(category.id, event.currentTarget);
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField name="nameAr" label={dict.categories.nameAr} defaultValue={category.nameAr} required />
            <TextField name="nameEn" label={dict.categories.nameEn} defaultValue={category.nameEn} required />
          </div>
          <TextField name="slug" label={dict.categories.slug} defaultValue={category.slug} className="latin" dir="ltr" />
          <p className="text-sm text-[var(--foreground-muted)]">
            {dict.categories.columnProducts}: {category.productCount}
          </p>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="isActive" defaultChecked={category.isActive} />
            {dict.categories.active}
          </label>
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              {dict.common.save}
            </Button>
            <Button type="button" size="sm" variant="danger" onClick={() => void remove(category.id)}>
              {dict.common.delete}
            </Button>
          </div>
        </form>
      ))}
    </div>
  );
}
