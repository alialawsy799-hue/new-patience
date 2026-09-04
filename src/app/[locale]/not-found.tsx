import { defaultLocale, getDictionary } from '@/lib/i18n';
import { Container, Section } from '@/components/ui/container';
import { ButtonLink } from '@/components/ui/button';

export default function LocaleNotFound() {
  const dict = getDictionary(defaultLocale);
  return (
    <Section className="pt-20">
      <Container size="narrow" className="text-center">
        <p className="latin text-sm font-bold tracking-[0.2em] text-[var(--accent)]">404</p>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">{dict.errors.notFoundTitle}</h1>
        <p className="mt-3 text-[var(--foreground-muted)]">{dict.errors.notFoundBody}</p>
        <ButtonLink href={`/${defaultLocale}`} className="mt-8">
          {dict.errors.goHome}
        </ButtonLink>
      </Container>
    </Section>
  );
}
