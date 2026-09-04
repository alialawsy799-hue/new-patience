'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Container, Section } from '@/components/ui/container';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Section className="pt-20">
      <Container size="narrow" className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">Unexpected error</h1>
        <p className="mt-3 text-[var(--foreground-muted)]">Something went wrong. Please try again.</p>
        <Button className="mt-8" onClick={reset}>
          Try again
        </Button>
      </Container>
    </Section>
  );
}
