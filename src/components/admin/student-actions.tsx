'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SelectField } from '@/components/ui/field';
import type { AdminDictionary } from '@/lib/i18n/admin';
import type { StageOption } from '@/lib/admin/content';

export function StudentActions({
  studentId,
  isActive,
  stages,
  heldStageIds,
  dict,
}: {
  studentId: string;
  isActive: boolean;
  stages: StageOption[];
  heldStageIds: string[];
  dict: AdminDictionary;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const available = stages.filter((stage) => !heldStageIds.includes(stage.id));

  async function toggleActive() {
    setPending(true);
    await fetch(`/api/admin/students/${studentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ isActive: !isActive }),
    });
    setPending(false);
    router.refresh();
  }

  async function grant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const stageId = String(new FormData(event.currentTarget).get('stageId'));
    await fetch(`/api/admin/students/${studentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ stageId, action: 'grant' }),
    });
    setPending(false);
    router.refresh();
  }

  async function revoke(stageId: string) {
    setPending(true);
    await fetch(`/api/admin/students/${studentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ stageId, action: 'revoke' }),
    });
    setPending(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <Button type="button" variant={isActive ? 'danger' : 'primary'} loading={pending} onClick={() => void toggleActive()}>
        {isActive ? dict.students.deactivate : dict.students.reactivate}
      </Button>
      {available.length > 0 ? (
        <form onSubmit={grant} className="flex flex-wrap items-end gap-3">
          <SelectField name="stageId" label={dict.students.grantAccess} className="min-w-48">
            {available.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.number}. {stage.titleEn}
              </option>
            ))}
          </SelectField>
          <Button type="submit" loading={pending}>
            {dict.students.grantAccess}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-[var(--foreground-subtle)]">{dict.students.allStagesGranted}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {heldStageIds.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => void revoke(id)}
            className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold hover:border-[var(--danger)] hover:text-[var(--danger)]"
          >
            {dict.students.revokeAccess}
          </button>
        ))}
      </div>
    </div>
  );
}
