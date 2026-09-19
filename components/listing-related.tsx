import { ListingCard } from "@/components/listing-card";
import { dealerForListing, getRelatedListings } from "@/lib/data";
import type { Listing } from "@/types";

export async function ListingRelated({ listing }: { listing: Listing }) {
  const related = await getRelatedListings(listing);
  if (related.listings.length === 0) return null;

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-[clamp(1.15rem,0.95rem+1vw,1.35rem)] font-bold tracking-tight">
          Related listings
        </h2>
        <p className="mt-1 text-[0.9rem] text-muted-foreground">
          More {listing.make} cars and vehicles in {listing.district}.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 nav:grid-cols-3">
        {related.listings.map((item) => (
          <ListingCard
            key={item.id}
            listing={item}
            dealer={dealerForListing(item, related.dealers)}
          />
        ))}
      </div>
    </section>
  );
}
