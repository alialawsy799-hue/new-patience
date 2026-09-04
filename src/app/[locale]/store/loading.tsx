import { Container, Section } from '@/components/ui/container';
import { Skeleton, SkeletonGrid } from '@/components/ui/skeleton';

export default function StoreLoading() {
  return (
    <Section className="pt-16">
      <Container>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-5 h-12 w-2/3" />
        <Skeleton className="mt-4 h-5 w-full max-w-xl" />
        <SkeletonGrid count={8} className="mt-16 lg:grid-cols-4" />
      </Container>
    </Section>
  );
}
