import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { dealerForListing, getFeaturedListings } from "@/lib/data";
import Link from "next/link";

export async function ListingsGrid({ bodyType }: { bodyType?: string }) {
  const { listings, dealers } = await getFeaturedListings(bodyType);

  return (
    <section id="listings" className="scroll-mt-28 pb-16 pt-5">
      <div className="mx-auto w-full max-w-site px-4 sm:px-6">
        <div className="mb-7 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-5">
          <div>
            <h2 className="text-[clamp(1.15rem,0.95rem+1vw,1.35rem)] font-bold tracking-tight">
              Featured listings
            </h2>
            <p className="mt-1 text-[0.9rem] text-muted-foreground">
              A snapshot of what&apos;s selling on CarsMW right now.
            </p>
          </div>
          <Button variant="ghost" className="h-11 shrink-0 font-semibold" asChild>
            <Link href="/listings">View all listings</Link>
          </Button>
        </div>
        {listings.length > 0 ? (
          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 nav:grid-cols-3">
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
