import { Container, Section } from '@/components/ui/container';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';

export default function StudentLoading() {
  return (
    <Section className="pt-12">
      <Container>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-5 h-10 w-1/2" />
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </Container>
    </Section>
  );
}
