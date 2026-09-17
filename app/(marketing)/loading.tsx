import { ListingCardSkeleton } from "@/components/listing-card";
import { RouteLoadingSignal } from "@/components/route-loading-signal";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <>
      <RouteLoadingSignal />
      <section className="relative pt-8 sm:pt-12 lg:pt-16">
        <div className="mx-auto w-full max-w-site px-4 sm:px-6">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_0.85fr]">
            <div className="space-y-4">
              <Skeleton className="h-12 w-full max-w-md" />
              <Skeleton className="h-12 w-2/3 max-w-sm" />
              <Skeleton className="h-4 w-full max-w-lg" />
              <div className="flex gap-3">
                <Skeleton className="h-11 w-36" />
                <Skeleton className="h-11 w-32" />
              </div>
            </div>
            <Skeleton className="hidden h-[200px] w-full lg:block lg:h-[300px]" />
          </div>
          <Skeleton className="mt-8 h-[4.5rem] w-full rounded-lg" />
        </div>
      </section>
      <div className="mx-auto w-full max-w-site px-4 pb-16 pt-10 sm:px-6">
        <Skeleton className="mb-7 h-6 w-48" />
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 nav:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <ListingCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </>
  );
}
