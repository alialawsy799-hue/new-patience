import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/shell';
import { getAdminLocaleContext } from '@/lib/admin/context';
import { getAdminSession } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const admin = await getAdminSession();
  if (!admin) redirect('/admin/login');
  const { locale, dict } = await getAdminLocaleContext();

  return (
    <AdminShell admin={admin} locale={locale} dict={dict}>
      {children}
    </AdminShell>
  );
}
