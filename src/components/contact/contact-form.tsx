'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TextAreaField, TextField } from '@/components/ui/field';
import { Alert } from '@/components/ui/states';
import { getDictionary, interpolate, type Locale } from '@/lib/i18n';

export function ContactForm({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const body = {
      name: String(form.get('name') ?? ''),
      email: String(form.get('email') ?? ''),
      phone: String(form.get('phone') ?? ''),
      subject: String(form.get('subject') ?? ''),
      message: String(form.get('message') ?? ''),
      locale,
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(
          payload?.error === 'rate_limited'
            ? interpolate(dict.errors.rateLimited, { minutes: 15 })
            : payload?.error === 'bad_request'
              ? dict.errors.messageTooShort
              : dict.errors.generic,
        );
        setPending(false);
        return;
      }
      setDone(true);
      event.currentTarget.reset();
    } catch {
      setError(dict.errors.network);
    }
    setPending(false);
  }

  if (done) {
    return (
      <Alert tone="success" title={dict.contact.successTitle}>
        {dict.contact.successBody}
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="name" label={dict.contact.name} required autoComplete="name" />
        <TextField
          name="email"
          type="email"
          label={dict.contact.email}
          required
          autoComplete="email"
          dir="ltr"
          className="latin"
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          name="phone"
          type="tel"
          label={dict.contact.phone}
          optionalLabel={dict.common.optional}
          autoComplete="tel"
          dir="ltr"
          className="latin"
        />
        <TextField name="subject" label={dict.contact.subject} optionalLabel={dict.common.optional} />
      </div>
      <TextAreaField
        name="message"
        label={dict.contact.message}
        placeholder={dict.contact.messagePlaceholder}
        required
        minLength={12}
      />
      <Button type="submit" size="lg" loading={pending} className="w-full sm:w-auto">
        {pending ? dict.contact.sending : dict.contact.send}
      </Button>
    </form>
  );
}
