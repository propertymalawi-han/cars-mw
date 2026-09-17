import { RouteLoadingSignal } from "@/components/route-loading-signal";
import { Skeleton } from "@/components/ui/skeleton";

export default function DealerLoading() {
  return (
    <div className="border-b bg-muted/40">
      <RouteLoadingSignal />
      <div className="mx-auto w-full max-w-site px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-6 nav:flex-row nav:items-start nav:gap-8">
          <Skeleton className="hidden h-[22rem] w-60 shrink-0 rounded-xl nav:block" />
          <div className="min-w-0 flex-1 space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-32 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-[22rem] w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
