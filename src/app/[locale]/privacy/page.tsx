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
  const dict = getDictionary(locale);
  return { title: dict.footer.privacy };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);

  const body =
    locale === 'ar'
      ? [
          'تجمع PATIENCE فقط البيانات اللازمة لتفعيل الدورة، تتبع التقدّم، ومعالجة الطلبات.',
          'لا تُباع بيانات الطلاب لأطراف ثالثة. تُحفظ جلسات الدخول في ملفات ارتباط محمية ولا تُستخدم أكواد التفعيل ككلمات مرور.',
          'لطلب حذف بياناتك تواصل معنا عبر صفحة التواصل بعد إعداد بيانات الاتصال من لوحة الإدارة.',
        ]
      : [
          'PATIENCE collects only the data needed to activate a course, track progress, and process store orders.',
          'Student data is not sold. Sessions are stored in protected cookies, and activation codes are never used as passwords.',
          'To request deletion of your data, write to us through the contact page once contact details have been configured in the admin dashboard.',
        ];

  return (
    <Section className="pt-14">
      <Container size="narrow">
        <h1 className="text-4xl font-extrabold tracking-tight">{dict.footer.privacy}</h1>
        <div className="mt-8 flex flex-col gap-4 text-base leading-relaxed text-[var(--foreground-muted)]">
          {body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </Container>
    </Section>
  );
}
