import { SettingsForm } from '@/components/admin/settings-form';
import { getAdminLocaleContext } from '@/lib/admin/context';
import { getSiteSettings } from '@/lib/settings';
import { redirectIfStaff } from '@/lib/auth/admin-pages';

export const metadata = { title: 'Settings' };

export default async function AdminSettingsPage() {
  await redirectIfStaff();
  const { dict } = await getAdminLocaleContext();
  const settings = await getSiteSettings();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">{dict.settings.title}</h1>
        <p className="mt-2 text-[var(--foreground-muted)]">{dict.settings.subtitle}</p>
      </div>
      <SettingsForm dict={dict} settings={settings} />
    </div>
  );
}
