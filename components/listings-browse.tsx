import { Suspense } from "react";
import Link from "next/link";
import { ListingCard, ListingCardSkeleton } from "@/components/listing-card";
import { ListingsPagination } from "@/components/listings-pagination";
import { RouteLoadingSignal } from "@/components/route-loading-signal";
import { VehicleSearchBar } from "@/components/search/vehicle-search-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { getPublicCategoryGroups } from "@/lib/catalog-status";
import {
  countListings,
  dealerForListing,
  getCategoryCounts,
  getMakeModelFacets,
  searchListings,
} from "@/lib/data";
import {
  defaultListingFilters,
  hasActiveFilters,
  listingsHref,
  type ListingFilters,
} from "@/lib/listing-filters";
import { categoryNoun } from "@/lib/vehicle-search";

function ListingsResultsFallback() {
  return (
    <div className="mt-8 space-y-6">
      <RouteLoadingSignal />
      <Skeleton className="h-4 w-48" />
      <div className="grid min-w-0 grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 9 }).map((_, index) => (
          <ListingCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

async function ListingsSearchBar({ filters }: { filters: ListingFilters }) {
  const [resultCount, categoryCounts, makeFacets, categoryGroups] = await Promise.all([
    countListings(filters),
    getCategoryCounts(),
    getMakeModelFacets(filters),
    getPublicCategoryGroups(),
  ]);

  return (
    <VehicleSearchBar
      filters={filters}
      categoryCounts={categoryCounts}
      resultCount={resultCount}
      makeFacets={makeFacets}
      categoryGroups={categoryGroups}
      className="mt-6 p-2 shadow-md sm:p-2.5"
    />
  );
}

async function ListingsResults({ filters }: { filters: ListingFilters }) {
  const result = await searchListings(filters);
  const { listings, dealers, total, page, pageSize, totalPages } = result;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const noun = categoryNoun(filters.category, total);
  const filtered = hasActiveFilters(filters);

  return (
    <div className="mt-8 space-y-6">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {total === 0
          ? `0 ${noun} match these filters`
          : `Showing ${from}–${to} of ${total} ${noun}`}
      </p>

      {listings.length > 0 ? (
        <div className="grid min-w-0 grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing, index) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              dealer={dealerForListing(listing, dealers)}
              priority={index < 3}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          <p>No {noun} match those filters. Try another district or make.</p>
          {filtered ? (
            <p className="mt-3">
              <Link
                href={listingsHref(defaultListingFilters())}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Clear filters
              </Link>
            </p>
          ) : null}
        </div>
      )}

      <ListingsPagination filters={filters} totalPages={totalPages} />
    </div>
  );
}

export function ListingsBrowse({
  filters,
  heading,
}: {
  filters: ListingFilters;
  heading: string;
}) {
  return (
    <div className="mx-auto w-full max-w-site px-4 py-8 sm:px-6 sm:py-10">
      <div className="space-y-2">
        <h1 className="text-[clamp(1.5rem,1.1rem+2vw,1.875rem)] font-semibold tracking-tight">
          {heading}
        </h1>
        <p className="text-muted-foreground">
          Filter by category, location, body type, price, and more. Prices are
          in Malawian Kwacha.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="mt-6 h-[4.5rem] w-full rounded-lg" />}>
        <ListingsSearchBar filters={filters} />
      </Suspense>

      <Suspense fallback={<ListingsResultsFallback />}>
        <ListingsResults filters={filters} />
      </Suspense>
    </div>
  );
}
