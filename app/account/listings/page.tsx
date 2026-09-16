import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountListingsTable } from "@/components/account/listings-table";
import { getAccountListings } from "@/lib/account";
import { requirePageUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "My listings",
};

export const dynamic = "force-dynamic";

export default async function AccountListingsPage() {
  const user = await requirePageUser("/account/listings");
  if (user.accountType === "dealer") {
    redirect("/dealer/dashboard/listings");
  }

  const listings = await getAccountListings(user.id);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-[clamp(1.5rem,1.1rem+2vw,1.875rem)] font-semibold tracking-tight">
          My listings
        </h1>
        <p className="text-muted-foreground">
          Edit your ads, mark a car as sold, or renew a listing after it expires.
        </p>
      </div>
      <AccountListingsTable listings={listings} />
    </div>
  );
}
