'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { Alert } from '@/components/ui/states';
import { interpolate } from '@/lib/i18n';
import type { AdminDictionary } from '@/lib/i18n/admin';

export function AdminLoginForm({ dict }: { dict: AdminDictionary }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          email: String(form.get('email') ?? ''),
          password: String(form.get('password') ?? ''),
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        details?: { retryAfterSeconds?: number };
      } | null;

      if (!response.ok) {
        if (payload?.error === 'rate_limited') {
          const minutes = Math.max(1, Math.ceil((payload.details?.retryAfterSeconds ?? 60) / 60));
          setError(interpolate(dict.signIn.locked, { minutes }));
        } else if (payload?.error === 'inactive') {
          setError(dict.signIn.inactive);
        } else if (payload?.error === 'invalid_credentials') {
          setError(dict.signIn.invalid);
        } else {
          setError(dict.signIn.failed);
        }
        setPending(false);
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch {
      setError(dict.signIn.failed);
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <TextField
        name="email"
        type="email"
        label={dict.signIn.email}
        required
        autoComplete="username"
        dir="ltr"
        className="latin"
      />
      <TextField
        name="password"
        type="password"
        label={dict.signIn.password}
        required
        autoComplete="current-password"
        dir="ltr"
      />
      <Button type="submit" size="lg" loading={pending} className="w-full">
        {pending ? dict.signIn.submitting : dict.signIn.submit}
      </Button>
    </form>
  );
}
