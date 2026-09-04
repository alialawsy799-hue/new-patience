import { Container } from '@/components/ui/container';
import { getDictionary, type Locale } from '@/lib/i18n';

export function StoreClosed({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(42rem 24rem at 50% 20%, rgb(254 107 5 / 0.16), transparent 62%)',
        }}
      />
      <Container className="relative flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
        <p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[var(--accent)]">
          {dict.store.heroEyebrow}
        </p>
        <h1 className="latin mt-6 text-7xl font-extrabold tracking-tight text-[var(--accent)] sm:text-8xl lg:text-[7.5rem]">
          {dict.store.soon}
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-[var(--foreground-muted)] sm:text-lg">
          {dict.store.closedBody}
        </p>
      </Container>
    </section>
  );
}
