import type { Metadata } from "next";
import { DealerListingsTable } from "@/components/dealer/listings-table";
import { getDealerListings, requireDealerPage } from "@/lib/dealer";

export const metadata: Metadata = {
  title: "My listings",
};

export const dynamic = "force-dynamic";

export default async function DealerListingsPage() {
  const { user, dealer } = await requireDealerPage("/dealer/dashboard/listings");
  if (!dealer) return null;

  const listings = await getDealerListings(user.id);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-[clamp(1.5rem,1.1rem+2vw,1.875rem)] font-semibold tracking-tight">
          My listings
        </h1>
        <p className="text-muted-foreground">
          Edit stock, mark cars as sold, duplicate ads, or feature a listing in search.
        </p>
      </div>
      <DealerListingsTable listings={listings} />
    </div>
  );
}
