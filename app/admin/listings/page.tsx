import type { Metadata } from "next";
import { AdminListingsDataTable } from "@/components/admin/listings-data-table";
import { AdminListingsFilters } from "@/components/admin/listings-filters";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getAdminListings,
  parseAdminListingSearchParams,
} from "@/lib/admin-listings";
import { formatNumber } from "@/lib/currency";

export const metadata: Metadata = {
  title: "Listings",
};

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const filters = parseAdminListingSearchParams(searchParams);
  const { listings, total, pageCount } = await getAdminListings(filters);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Listings"
        description="Search, moderate, and update marketplace stock regardless of owner."
      />
      <Card className="shadow-none">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-[13px] font-medium">All listings</CardTitle>
          <CardDescription>
            {formatNumber(total)} listing{total === 1 ? "" : "s"} in this view.
          </CardDescription>
        </CardHeader>
        <AdminListingsFilters filters={filters} />
        <CardContent className="p-0">
          <AdminListingsDataTable
            listings={listings}
            total={total}
            pageCount={pageCount}
            filters={filters}
          />
        </CardContent>
      </Card>
    </div>
  );
}
