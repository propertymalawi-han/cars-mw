import { ListingCardSkeleton } from "@/components/listing-card";
import { RouteLoadingSignal } from "@/components/route-loading-signal";
import { Skeleton } from "@/components/ui/skeleton";

export default function ListingDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-site space-y-10 px-4 py-8 sm:space-y-12 sm:px-6 sm:py-10">
      <RouteLoadingSignal />
      <div className="grid min-w-0 items-start gap-8 lg:grid-cols-[minmax(0,1.5fr)_320px]">
        <div className="space-y-6">
          <Skeleton className="aspect-[16/9] w-full rounded-lg sm:aspect-[16/10]" />
          <div className="space-y-3">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-24 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-80 w-full rounded-lg" />
      </div>
      <div className="space-y-5">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 nav:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <ListingCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
