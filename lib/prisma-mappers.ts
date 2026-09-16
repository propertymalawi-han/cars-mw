import type { Dealer as PrismaDealer, Listing as PrismaListing } from "@prisma/client";
import { isPrivateListingPastTtl } from "@/lib/listing-expiry";
import type { Dealer, Listing, MalawiCity, MalawiDistrict } from "@/types";

export function mapPrismaListing(row: PrismaListing): Listing {
  const listing: Listing = {
    id: row.id,
    title: row.title,
    make: row.make,
    model: row.model,
    year: row.year,
    price: row.price,
    mileage: row.mileage,
    transmission: row.transmission,
    fuelType: row.fuelType,
    bodyType: row.bodyType,
    district: row.district as MalawiDistrict,
    city: row.city as MalawiCity,
    images: row.images ?? [],
    description: row.description,
    sellerId: row.sellerId,
    sellerType: row.sellerType,
    status: row.status,
    featuredUntil: row.featuredUntil?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
  if (isPrivateListingPastTtl(listing)) {
    listing.status = "expired";
  }
  return listing;
}

export function mapPrismaDealer(row: PrismaDealer): Dealer {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logoUrl,
    districts: (row.districts ?? []) as MalawiDistrict[],
    verified: row.verified,
    phone: row.phone,
    whatsapp: row.whatsapp,
    description: row.description,
    userId: row.userId,
  };
}

export function dealerFromSeller(
  seller: { dealer: PrismaDealer | null } | null | undefined,
  sellerType: Listing["sellerType"],
): Dealer | undefined {
  if (sellerType !== "dealer" || !seller?.dealer) return undefined;
  return mapPrismaDealer(seller.dealer);
}
