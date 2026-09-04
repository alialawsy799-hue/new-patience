'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { Alert } from '@/components/ui/states';
import { parseMoneyToCents } from '@/lib/admin/money';
import type { AdminDictionary } from '@/lib/i18n/admin';

export function QuickProductForm({ dict }: { dict: AdminDictionary }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function uploadImage(file: File): Promise<string | null> {
    const form = new FormData();
    form.set('file', file);
    const response = await fetch('/api/admin/uploads', {
      method: 'POST',
      credentials: 'same-origin',
      body: form,
    });
    const payload = (await response.json().catch(() => null)) as { url?: string } | null;
    return response.ok && payload?.url ? payload.url : null;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setOk(false);

    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get('name') ?? '').trim();
    const priceCents = parseMoneyToCents(String(data.get('price') ?? '0'));
    const file = data.get('image');

    if (priceCents === null) {
      setError(dict.products.priceHint);
      setPending(false);
      return;
    }

    let imageUrl = '';
    if (file instanceof File && file.size > 0) {
      const uploaded = await uploadImage(file);
      if (!uploaded) {
        setError(dict.products.imageFailed);
        setPending(false);
        return;
      }
      imageUrl = uploaded;
    }

    const response = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        nameAr: name,
        nameEn: name,
        priceCents,
        stock: 99,
        images: imageUrl ? [imageUrl] : [],
        isActive: true,
        comingSoon: false,
      }),
    });

    setPending(false);
    if (!response.ok) {
      setError(dict.common.saveFailed);
      return;
    }

    form.reset();
    setOk(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 rounded-2xl border border-[var(--border)] p-6">
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {ok ? <Alert tone="success">{dict.products.createdSimple}</Alert> : null}
      <TextField name="name" label={dict.products.simpleName} required maxLength={160} />
      <TextField
        name="price"
        label={dict.products.price}
        hint={dict.products.priceHint}
        required
        defaultValue="0"
        className="latin"
        dir="ltr"
      />
      <label className="flex flex-col gap-2 text-sm font-semibold">
        {dict.products.simpleImage}
        <input
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          required
          className="rounded-xl border border-[var(--border-strong)] px-3 py-2 text-sm font-normal"
        />
      </label>
      <Button type="submit" loading={pending} className="w-fit">
        {pending ? dict.common.creating : dict.products.add}
      </Button>
    </form>
  );
}
