import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container, Section } from '@/components/ui/container';
import { getDictionary, isLocale, type Locale } from '@/lib/i18n';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDictionary(locale).footer.terms };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);

  const body =
    locale === 'ar'
      ? [
          'يمنح كل كود تفعيل طالباً واحداً صلاحية مرحلة واحدة فقط، ولا يمكن إعادة استخدامه.',
          'محتوى الدورات محمي ويُعرض عبر مشغّل Vimeo المضمّن. لا يُسمح بإعادة توزيع المحتوى.',
          'طلبات المتجر تُؤكَّد يدوياً مع الفريق بعد إرسال الطلب.',
        ]
      : [
          'Each activation code grants one student access to exactly one stage, and cannot be reused.',
          'Course content is protected and played through the official Vimeo embed. Redistribution is not permitted.',
          'Store orders are confirmed directly with our team after they are placed.',
        ];

  return (
    <Section className="pt-14">
      <Container size="narrow">
        <h1 className="text-4xl font-extrabold tracking-tight">{dict.footer.terms}</h1>
        <div className="mt-8 flex flex-col gap-4 text-base leading-relaxed text-[var(--foreground-muted)]">
          {body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </Container>
    </Section>
  );
}
