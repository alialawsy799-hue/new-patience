'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { Alert } from '@/components/ui/states';
import { getDictionary, interpolate, localePath, type Locale } from '@/lib/i18n';

export function CheckoutForm({
  locale,
  defaultName,
}: {
  locale: Locale;
  defaultName?: string;
}) {
  const dict = getDictionary(locale);
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const body = {
      name: String(form.get('name') ?? ''),
      phone: String(form.get('phone') ?? ''),
      address: String(form.get('address') ?? ''),
      locale,
    };

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body),
      });
      const payload = (await response.json().catch(() => null)) as
        | { orderNumber?: string; error?: string }
        | null;

      if (!response.ok) {
        const code = payload?.error ?? 'generic';
        setError(
          code === 'empty_cart'
            ? dict.errors.emptyCart
            : code === 'out_of_stock'
              ? dict.errors.outOfStock
              : code === 'rate_limited'
                ? interpolate(dict.errors.rateLimited, { minutes: 15 })
                : dict.errors.generic,
        );
        setPending(false);
        return;
      }

      if (payload?.orderNumber) {
        router.push(
          `${localePath(locale, '/store/checkout/success')}?order=${encodeURIComponent(payload.orderNumber)}`,
        );
        router.refresh();
        return;
      }
      setError(dict.errors.generic);
    } catch {
      setError(dict.errors.network);
    }
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8">
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 text-lg font-bold">{dict.checkout.contactSection}</legend>
        <TextField
          name="name"
          label={dict.checkout.name}
          required
          defaultValue={defaultName}
          autoComplete="name"
        />
        <TextField
          name="phone"
          type="tel"
          label={dict.checkout.phone}
          required
          autoComplete="tel"
          dir="ltr"
          className="latin"
        />
        <TextField
          name="address"
          label={dict.checkout.address}
          required
          autoComplete="street-address"
        />
      </fieldset>

      <Button type="submit" size="lg" loading={pending} className="w-full sm:w-auto">
        {pending ? dict.checkout.placing : dict.checkout.placeOrder}
      </Button>
    </form>
  );
}
