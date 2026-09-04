'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TextAreaField, TextField } from '@/components/ui/field';
import { Alert } from '@/components/ui/states';
import { centsToInput, parseMoneyToCents } from '@/lib/admin/money';
import type { AdminDictionary } from '@/lib/i18n/admin';
import type { SiteSettings } from '@/lib/settings';

export function SettingsForm({ dict, settings }: { dict: AdminDictionary; settings: SiteSettings }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const shipping = parseMoneyToCents(String(form.get('shippingFlat') ?? '0'));
    const freeOver = parseMoneyToCents(String(form.get('freeShippingOver') ?? '0'));
    if (shipping === null || freeOver === null) {
      setError(dict.settings.moneyHint);
      setPending(false);
      return;
    }

    const body = {
      general: {
        siteName: form.get('siteName'),
        taglineAr: form.get('taglineAr'),
        taglineEn: form.get('taglineEn'),
      },
      contact: {
        email: form.get('contactEmail'),
        phone: form.get('contactPhone'),
        whatsapp: form.get('whatsapp'),
        addressAr: form.get('addressAr'),
        addressEn: form.get('addressEn'),
        hoursAr: form.get('hoursAr'),
        hoursEn: form.get('hoursEn'),
      },
      social: {
        instagram: form.get('instagram'),
        facebook: form.get('facebook'),
        youtube: form.get('youtube'),
        telegram: form.get('telegram'),
        x: form.get('x'),
        linkedin: form.get('linkedin'),
      },
      hero: {
        titleAr: form.get('heroTitleAr'),
        titleEn: form.get('heroTitleEn'),
        subtitleAr: form.get('heroSubtitleAr'),
        subtitleEn: form.get('heroSubtitleEn'),
      },
      course: {
        autoCompleteThreshold: Number(form.get('autoCompleteThreshold') || 0),
        allowManualCompletion: form.get('allowManualCompletion') === 'on',
        allowUncompletion: form.get('allowUncompletion') === 'on',
      },
      store: {
        enabled: form.get('storeEnabled') === 'on',
        currency: form.get('currency'),
        shippingFlatCents: shipping,
        freeShippingOverCents: freeOver,
      },
      telegramOrders: {
        botToken: form.get('telegramBotToken'),
        chatId: form.get('telegramChatId'),
      },
    };

    const response = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    });
    setPending(false);
    if (!response.ok) {
      setError(dict.common.saveFailed);
      return;
    }
    setMessage(dict.settings.saved);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-10">
      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <fieldset className="grid gap-4">
        <legend className="mb-2 text-lg font-bold">{dict.settings.general}</legend>
        <TextField name="siteName" label={dict.settings.siteName} defaultValue={settings.general.siteName} required />
        <TextField name="taglineAr" label={dict.settings.taglineAr} defaultValue={settings.general.taglineAr} />
        <TextField name="taglineEn" label={dict.settings.taglineEn} defaultValue={settings.general.taglineEn} />
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-2 text-lg font-bold">{dict.settings.contact}</legend>
        <TextField name="contactEmail" type="email" label={dict.settings.contactEmail} defaultValue={settings.contact.email} className="latin" dir="ltr" />
        <TextField name="contactPhone" label={dict.settings.contactPhone} defaultValue={settings.contact.phone} className="latin" dir="ltr" />
        <TextField name="whatsapp" label={dict.settings.whatsapp} defaultValue={settings.contact.whatsapp} className="latin" dir="ltr" />
        <TextField name="addressAr" label={dict.settings.addressAr} defaultValue={settings.contact.addressAr} />
        <TextField name="addressEn" label={dict.settings.addressEn} defaultValue={settings.contact.addressEn} />
        <TextField name="hoursAr" label={dict.settings.hoursAr} defaultValue={settings.contact.hoursAr} />
        <TextField name="hoursEn" label={dict.settings.hoursEn} defaultValue={settings.contact.hoursEn} />
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-2 text-lg font-bold">{dict.settings.social}</legend>
        <p className="text-sm text-[var(--foreground-subtle)]">{dict.settings.socialHint}</p>
        {(['instagram', 'facebook', 'youtube', 'telegram', 'x', 'linkedin'] as const).map((key) => (
          <TextField key={key} name={key} label={key} defaultValue={settings.social[key]} className="latin" dir="ltr" />
        ))}
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-2 text-lg font-bold">{dict.settings.hero}</legend>
        <p className="text-sm text-[var(--foreground-subtle)]">{dict.settings.heroHint}</p>
        <TextField name="heroTitleAr" label={dict.settings.heroTitleAr} defaultValue={settings.hero.titleAr} />
        <TextField name="heroTitleEn" label={dict.settings.heroTitleEn} defaultValue={settings.hero.titleEn} />
        <TextAreaField name="heroSubtitleAr" label={dict.settings.heroSubtitleAr} defaultValue={settings.hero.subtitleAr} />
        <TextAreaField name="heroSubtitleEn" label={dict.settings.heroSubtitleEn} defaultValue={settings.hero.subtitleEn} />
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-2 text-lg font-bold">{dict.settings.course}</legend>
        <TextField
          name="autoCompleteThreshold"
          type="number"
          min={0}
          max={100}
          label={dict.settings.autoCompleteThreshold}
          hint={dict.settings.autoCompleteHint}
          defaultValue={settings.course.autoCompleteThreshold}
        />
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="allowManualCompletion" defaultChecked={settings.course.allowManualCompletion} />
          {dict.settings.allowManualCompletion}
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="allowUncompletion" defaultChecked={settings.course.allowUncompletion} />
          {dict.settings.allowUncompletion}
        </label>
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-2 text-lg font-bold">{dict.settings.store}</legend>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="storeEnabled" defaultChecked={settings.store.enabled} />
          {dict.settings.storeEnabled}
        </label>
        <TextField name="currency" label={dict.settings.currency} hint={dict.settings.currencyHint} defaultValue={settings.store.currency} className="latin" dir="ltr" />
        <TextField name="shippingFlat" label={dict.settings.shippingFlat} hint={dict.settings.moneyHint} defaultValue={centsToInput(settings.store.shippingFlatCents)} className="latin" dir="ltr" />
        <TextField name="freeShippingOver" label={dict.settings.freeShippingOver} hint={dict.settings.moneyHint} defaultValue={centsToInput(settings.store.freeShippingOverCents)} className="latin" dir="ltr" />
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-2 text-lg font-bold">{dict.settings.telegramOrders}</legend>
        <p className="text-sm text-[var(--foreground-subtle)]">{dict.settings.telegramOrdersHint}</p>
        <TextField
          name="telegramBotToken"
          label={dict.settings.telegramBotToken}
          defaultValue={settings.telegramOrders.botToken}
          className="latin"
          dir="ltr"
        />
        <TextField
          name="telegramChatId"
          label={dict.settings.telegramChatId}
          defaultValue={settings.telegramOrders.chatId}
          className="latin"
          dir="ltr"
        />
      </fieldset>

      <Button type="submit" loading={pending} className="w-fit">
        {pending ? dict.common.saving : dict.common.save}
      </Button>
    </form>
  );
}
