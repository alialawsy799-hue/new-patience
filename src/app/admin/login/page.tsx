import { redirect } from 'next/navigation';
import { PatienceLogo } from '@/components/brand/logo';
import { AdminLoginForm } from '@/components/admin/login-form';
import { Badge } from '@/components/ui/badge';
import { getAdminLocaleContext } from '@/lib/admin/context';
import { getAdminSession } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  const admin = await getAdminSession();
  if (admin) redirect('/admin');

  const { dict } = await getAdminLocaleContext();

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[var(--shadow-card)]">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <PatienceLogo size="md" />
          <Badge tone="accent">{dict.signIn.badge}</Badge>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{dict.signIn.title}</h1>
            <p className="mt-2 text-sm text-[var(--foreground-muted)]">{dict.signIn.subtitle}</p>
          </div>
        </div>
        <AdminLoginForm dict={dict} />
      </div>
    </main>
  );
}
