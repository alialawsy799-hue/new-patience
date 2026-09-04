'use client';

import { useRouter } from 'next/navigation';
import type { AdminDictionary } from '@/lib/i18n/admin';
import type { MessageStatus } from '@/lib/db/schema';

export function MessageStatusButtons({
  id,
  status,
  dict,
}: {
  id: string;
  status: MessageStatus;
  dict: AdminDictionary;
}) {
  const router = useRouter();

  async function setStatus(next: MessageStatus) {
    await fetch(`/api/admin/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ status: next }),
    });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status !== 'new' ? (
        <button type="button" className="text-xs font-semibold" onClick={() => void setStatus('new')}>
          {dict.messages.markNew}
        </button>
      ) : null}
      {status !== 'read' ? (
        <button type="button" className="text-xs font-semibold" onClick={() => void setStatus('read')}>
          {dict.messages.markRead}
        </button>
      ) : null}
      {status !== 'archived' ? (
        <button type="button" className="text-xs font-semibold" onClick={() => void setStatus('archived')}>
          {dict.messages.markArchived}
        </button>
      ) : null}
    </div>
  );
}
