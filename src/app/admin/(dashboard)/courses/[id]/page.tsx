import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StageEditor } from '@/components/admin/stage-editor';
import { getStageForAdmin } from '@/lib/admin/content';
import { getAdminLocaleContext } from '@/lib/admin/context';
import { redirectIfStaff } from '@/lib/auth/admin-pages';

export const metadata = { title: 'Stage' };

export default async function AdminStagePage({ params }: { params: Promise<{ id: string }> }) {
  await redirectIfStaff();
  const { id } = await params;
  const { dict } = await getAdminLocaleContext();
  const data = await getStageForAdmin(id);
  if (!data) notFound();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Link href="/admin/courses" className="text-sm font-semibold text-[var(--accent)]">
        ← {dict.courses.backToList}
      </Link>
      <h1 className="text-3xl font-extrabold tracking-tight">{dict.courses.stageTitle}</h1>
      <StageEditor stage={data.stage} lessons={data.lessons} dict={dict} />
    </div>
  );
}
