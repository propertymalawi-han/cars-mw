import { ListingCardSkeleton } from "@/components/listing-card";
import { RouteLoadingSignal } from "@/components/route-loading-signal";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <>
      <RouteLoadingSignal />
      <section className="relative">
        <Skeleton className="-mt-16 h-[32rem] w-full rounded-none sm:h-[38rem] lg:h-[min(50rem,60vw)]" />
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
