import { prisma } from "@/lib/prisma";

export const PRIVATE_LISTING_TTL_DAYS = 60;

export function listingExpiryCutoff(now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - PRIVATE_LISTING_TTL_DAYS);
  return cutoff;
}

export function isPrivateListingPastTtl(listing: {
  sellerType: string;
  status: string;
  createdAt: string | Date;
}) {
  if (listing.sellerType !== "private" || listing.status !== "active") return false;
  return new Date(listing.createdAt).getTime() < listingExpiryCutoff().getTime();
}

/** PostgREST `or` clause that keeps dealer ads and private ads still within the TTL. */
export function privateListingFreshnessOrFilter(now = new Date()) {
  return `seller_type.eq.dealer,created_at.gte."${listingExpiryCutoff(now).toISOString()}"`;
}

export async function expireStalePrivateListings(sellerId?: string) {
  return prisma.listing.updateMany({
    where: {
      sellerType: "private",
      status: "active",
      createdAt: { lt: listingExpiryCutoff() },
      ...(sellerId ? { sellerId } : {}),
    },
    data: { status: "expired" },
  });
}

export function privateListingRenewData() {
  return {
    status: "active" as const,
    createdAt: new Date(),
  };
}
