import Link from "next/link";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { dealerForListing, getDealers, getFeaturedListings } from "@/lib/data";

export async function ListingsGrid({ bodyType }: { bodyType?: string }) {
  const [featured, dealers] = await Promise.all([
    getFeaturedListings(bodyType),
    getDealers(),
  ]);

  return (
    <section id="listings" className="scroll-mt-28 pb-16 pt-5">
      <div className="mx-auto w-full max-w-site px-6">
        <div className="mb-7 flex items-end justify-between gap-5">
          <div>
            <h2 className="text-[1.35rem] font-bold tracking-tight">
              Featured listings
            </h2>
            <p className="mt-1 text-[0.9rem] text-muted-foreground">
              A snapshot of what&apos;s selling on CarsMW right now.
            </p>
          </div>
          <Button variant="ghost" className="font-semibold" asChild>
            <Link href="/listings">View all listings</Link>
          </Button>
        </div>
        {featured.length > 0 ? (
          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                dealer={dealerForListing(listing, dealers)}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
            No featured listings in this body type yet.{" "}
            <Link href="/listings" className="font-medium text-foreground underline-offset-4 hover:underline">
              View all listings
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
