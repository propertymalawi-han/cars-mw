import type { Dealer, Listing } from "@/types";

export function dealerForListing(listing: Listing, dealers: Dealer[]) {
  if (listing.sellerType !== "dealer") return undefined;
  return dealers.find((dealer) => dealer.userId === listing.sellerId);
}
