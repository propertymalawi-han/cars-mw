import { ListingCardSkeleton } from "@/components/listing-card";
import { RouteLoadingSignal } from "@/components/route-loading-signal";
import { Skeleton } from "@/components/ui/skeleton";

export default function ListingsLoading() {
  return (
    <div className="mx-auto w-full max-w-site px-4 py-8 sm:px-6 sm:py-10">
      <RouteLoadingSignal />
      <div className="space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <Skeleton className="mt-6 h-[4.5rem] w-full rounded-lg" />
      <div className="mt-8 space-y-6">
        <Skeleton className="h-4 w-48" />
        <div className="grid min-w-0 grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <ListingCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
