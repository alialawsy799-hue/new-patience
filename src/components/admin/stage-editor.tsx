'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SelectField, TextAreaField, TextField } from '@/components/ui/field';
import { Alert } from '@/components/ui/states';
import type { AdminDictionary } from '@/lib/i18n/admin';
import type { Lesson, Stage } from '@/lib/db/schema';

export function StageEditor({
  stage,
  lessons,
  dict,
}: {
  stage: Stage;
  lessons: Lesson[];
  dict: AdminDictionary;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function saveStage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/admin/stages/${stage.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        titleAr: form.get('titleAr'),
        titleEn: form.get('titleEn'),
        subtitleAr: form.get('subtitleAr'),
        subtitleEn: form.get('subtitleEn'),
        descriptionAr: form.get('descriptionAr'),
        descriptionEn: form.get('descriptionEn'),
        accent: form.get('accent'),
        coverImageUrl: String(form.get('coverImageUrl') || '') || null,
        isPublished: form.get('isPublished') === 'on',
      }),
    });
    setPending(false);
    setMessage(response.ok ? dict.courses.stageSaved : dict.common.saveFailed);
    if (response.ok) router.refresh();
  }

  async function saveLesson(lessonId: string, form: HTMLFormElement) {
    const data = new FormData(form);
    await fetch(`/api/admin/lessons/${lessonId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        titleAr: data.get('titleAr'),
        titleEn: data.get('titleEn'),
        descriptionAr: data.get('descriptionAr'),
        descriptionEn: data.get('descriptionEn'),
        vimeoVideoId: data.get('vimeoVideoId'),
        vimeoHash: data.get('vimeoHash'),
        thumbnailUrl: data.get('thumbnailUrl'),
        durationSeconds: Number(data.get('durationSeconds') || 0),
        isPublished: data.get('isPublished') === 'on',
      }),
    });
    setMessage(dict.courses.lessonSaved);
    router.refresh();
  }

  async function addLesson(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await fetch('/api/admin/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        stageId: stage.id,
        titleAr: data.get('titleAr'),
        titleEn: data.get('titleEn'),
        descriptionAr: data.get('descriptionAr') ?? '',
        descriptionEn: data.get('descriptionEn') ?? '',
        vimeoVideoId: data.get('vimeoVideoId'),
        durationSeconds: Number(data.get('durationSeconds') || 0),
      }),
    });
    event.currentTarget.reset();
    setMessage(dict.courses.lessonSaved);
    router.refresh();
  }

  async function move(id: string, direction: 'up' | 'down') {
    await fetch(`/api/admin/lessons/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ move: direction }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    if (!window.confirm(dict.courses.deleteLessonBody)) return;
    await fetch(`/api/admin/lessons/${id}`, { method: 'DELETE', credentials: 'same-origin' });
    setMessage(dict.courses.lessonDeleted);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-10">
      {message ? <Alert tone="success">{message}</Alert> : null}

      <form onSubmit={saveStage} className="grid gap-4 rounded-2xl border border-[var(--border)] p-6">
        <h2 className="text-lg font-bold">{dict.courses.stageFields}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="titleAr" label={dict.courses.titleAr} defaultValue={stage.titleAr} required />
          <TextField name="titleEn" label={dict.courses.titleEn} defaultValue={stage.titleEn} required />
          <TextField name="subtitleAr" label={dict.courses.subtitleAr} defaultValue={stage.subtitleAr} />
          <TextField name="subtitleEn" label={dict.courses.subtitleEn} defaultValue={stage.subtitleEn} />
        </div>
        <TextAreaField name="descriptionAr" label={dict.courses.descriptionAr} defaultValue={stage.descriptionAr} />
        <TextAreaField name="descriptionEn" label={dict.courses.descriptionEn} defaultValue={stage.descriptionEn} />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField name="accent" label={dict.courses.accent} defaultValue={stage.accent}>
            {['orange', 'elegant', 'calm', 'passion', 'sky'].map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </SelectField>
          <TextField name="coverImageUrl" label={dict.courses.coverImage} defaultValue={stage.coverImageUrl ?? ''} />
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="isPublished" defaultChecked={stage.isPublished} />
          {dict.courses.published}
        </label>
        <Button type="submit" loading={pending}>
          {dict.common.save}
        </Button>
      </form>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">{dict.courses.lessons}</h2>
        {lessons.length === 0 ? <p className="text-sm text-[var(--foreground-muted)]">{dict.courses.noLessons}</p> : null}
        {lessons.map((lesson) => (
          <form
            key={lesson.id}
            className="grid gap-3 rounded-2xl border border-[var(--border)] p-5"
            onSubmit={(event) => {
              event.preventDefault();
              void saveLesson(lesson.id, event.currentTarget);
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="latin text-xs font-bold text-[var(--foreground-subtle)]">#{lesson.position}</p>
              <div className="flex gap-2">
                <button type="button" className="text-xs font-semibold" onClick={() => void move(lesson.id, 'up')}>
                  {dict.courses.moveUp}
                </button>
                <button type="button" className="text-xs font-semibold" onClick={() => void move(lesson.id, 'down')}>
                  {dict.courses.moveDown}
                </button>
                <button type="button" className="text-xs font-semibold text-[var(--danger)]" onClick={() => void remove(lesson.id)}>
                  {dict.courses.deleteLesson}
                </button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField name="titleAr" label={dict.courses.lessonTitleAr} defaultValue={lesson.titleAr} required />
              <TextField name="titleEn" label={dict.courses.lessonTitleEn} defaultValue={lesson.titleEn} required />
            </div>
            <TextAreaField name="descriptionAr" label={dict.courses.lessonDescriptionAr} defaultValue={lesson.descriptionAr} />
            <TextAreaField name="descriptionEn" label={dict.courses.lessonDescriptionEn} defaultValue={lesson.descriptionEn} />
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                name="vimeoVideoId"
                label={dict.courses.vimeoId}
                hint={dict.courses.vimeoIdHint}
                defaultValue={lesson.vimeoVideoId ?? ''}
                className="latin"
                dir="ltr"
              />
              <TextField
                name="vimeoHash"
                label={dict.courses.vimeoHash}
                hint={dict.courses.vimeoHashHint}
                defaultValue={lesson.vimeoHash ?? ''}
                className="latin"
                dir="ltr"
              />
              <TextField name="thumbnailUrl" label={dict.courses.thumbnail} defaultValue={lesson.thumbnailUrl ?? ''} />
              <TextField
                name="durationSeconds"
                type="number"
                min={0}
                label={dict.courses.duration}
                defaultValue={lesson.durationSeconds}
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" name="isPublished" defaultChecked={lesson.isPublished} />
              {dict.courses.published}
            </label>
            <Button type="submit" variant="secondary" size="sm">
              {dict.common.save}
            </Button>
          </form>
        ))}
      </section>

      <form onSubmit={addLesson} className="grid gap-3 rounded-2xl border border-dashed border-[var(--border-strong)] p-5">
        <h3 className="font-bold">{dict.courses.addLesson}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField name="titleAr" label={dict.courses.lessonTitleAr} required />
          <TextField name="titleEn" label={dict.courses.lessonTitleEn} required />
        </div>
        <TextField name="vimeoVideoId" label={dict.courses.vimeoId} hint={dict.courses.vimeoIdHint} className="latin" dir="ltr" />
        <TextField name="durationSeconds" type="number" min={0} defaultValue={0} label={dict.courses.duration} />
        <Button type="submit">{dict.courses.addLesson}</Button>
      </form>
    </div>
  );
}
