'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDictionary, localePath, type Locale } from '@/lib/i18n';

export function SignOutButton({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    if (!window.confirm(dict.student.signOutConfirm)) return;
    setPending(true);
    try {
      await fetch('/api/student/session', { method: 'DELETE' });
      router.push(localePath(locale, '/'));
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={signOut}
      loading={pending}
      icon={pending ? undefined : <LogOut className="size-4 rtl:-scale-x-100" aria-hidden />}
    >
      {dict.student.signOut}
    </Button>
  );
}
