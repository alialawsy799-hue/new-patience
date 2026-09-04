import { Container, Section } from '@/components/ui/container';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';

export default function CoursesLoading() {
  return (
    <Section className="pt-14 sm:pt-16 lg:pt-20">
      <Container>
        <div className="max-w-2xl">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-5 h-12 w-3/4" />
          <Skeleton className="mt-4 h-5 w-full" />
          <Skeleton className="mt-2 h-5 w-2/3" />
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3" role="status" aria-busy="true">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonCard key={index} className="h-80" />
          ))}
        </div>
      </Container>
    </Section>
  );
}
