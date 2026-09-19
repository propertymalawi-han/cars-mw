import type { Metadata } from "next";
import { Suspense } from "react";
import { ListingsBrowse } from "@/components/listings-browse";
import { ListingsPageSkeleton } from "@/components/listing-skeletons";
import { listingsHref, parseListingSearchParams, type ListingSearchParams } from "@/lib/listing-filters";
import { categoryDisplayName } from "@/lib/vehicle-search";

export const metadata: Metadata = {
  title: "Browse listings",
  description: "Search cars for sale across Malawi, priced in MWK.",
};

type ListingsPageProps = {
  searchParams: ListingSearchParams;
};

export default function ListingsPage({ searchParams }: ListingsPageProps) {
  const filters = parseListingSearchParams(searchParams);
  const heading = `${categoryDisplayName(filters.category)} for sale in Malawi`;

  return (
    <Suspense key={listingsHref(filters)} fallback={<ListingsPageSkeleton heading={heading} />}>
      <ListingsBrowse filters={filters} heading={heading} />
    </Suspense>
  );
}
