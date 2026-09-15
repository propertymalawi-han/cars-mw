import type { Metadata } from "next";
import Link from "next/link";
import { ListingCard } from "@/components/listing-card";
import { ListingsPagination } from "@/components/listings-pagination";
import { SearchFilters } from "@/components/search-filters";
import { dealerForListing, getDealers, getMakes, searchListings } from "@/lib/data";
import {
  hasActiveFilters,
  listingsHref,
  parseListingSearchParams,
  type ListingSearchParams,
} from "@/lib/listing-filters";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse listings",
  description: "Search cars for sale across Malawi, priced in MWK.",
};

type ListingsPageProps = {
  searchParams: ListingSearchParams;
};

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const filters = parseListingSearchParams(searchParams);
  const [result, dealers, makes] = await Promise.all([
    searchListings(filters),
    getDealers(),
    getMakes(),
  ]);

  const { listings, total, page, pageSize, totalPages } = result;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const noun = total === 1 ? "car" : "cars";
  const filtered = hasActiveFilters(filters);

  return (
    <div className="mx-auto w-full max-w-site px-6 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Cars for sale in Malawi
        </h1>
        <p className="text-muted-foreground">
          Filter by make, body type, district, price, or transmission. Prices are
          in Malawian Kwacha.
        </p>
      </div>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <SearchFilters filters={filters} makes={makes} />

        <div className="space-y-6">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {total === 0
              ? `0 ${noun} match these filters`
              : `Showing ${from}–${to} of ${total} ${noun}`}
          </p>

          {listings.length > 0 ? (
            <div className="grid gap-[18px] sm:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  dealer={dealerForListing(listing, dealers)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
              <p>No cars match those filters. Try another district or make.</p>
              {filtered ? (
                <p className="mt-3">
                  <Link
                    href={listingsHref({ body: [], page: 1 })}
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
      </div>
    </div>
  );
}
