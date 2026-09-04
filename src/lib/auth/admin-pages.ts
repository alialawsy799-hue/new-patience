import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth/admin';

/** Staff may only use codes + store. Send them back if they open anything else. */
export async function redirectIfStaff() {
  const admin = await getAdminSession();
  if (admin?.role === 'staff') redirect('/admin/codes');
}
