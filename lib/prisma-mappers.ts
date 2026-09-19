import type { Dealer as PrismaDealer, Listing as PrismaListing } from "@prisma/client";
import { isPrivateListingPastTtl } from "@/lib/listing-expiry";
import type { Dealer, Listing, MalawiCity, MalawiDistrict } from "@/types";

type ListingMapperInput = Pick<
  PrismaListing,
  | "id"
  | "vehicleNumber"
  | "title"
  | "make"
  | "model"
  | "year"
  | "price"
  | "mileage"
  | "transmission"
  | "fuelType"
  | "bodyType"
  | "district"
  | "city"
  | "images"
  | "sellerId"
  | "sellerType"
  | "status"
  | "featuredUntil"
  | "createdAt"
> & {
  description?: string;
  mutedReason?: string | null;
  deletedAt?: Date | null;
};

type DealerMapperInput = Pick<
  PrismaDealer,
  | "id"
  | "name"
  | "slug"
  | "logoUrl"
  | "districts"
  | "verified"
  | "phone"
  | "whatsapp"
  | "description"
  | "userId"
>;

export function mapPrismaListing(row: ListingMapperInput): Listing {
  const listing: Listing = {
    id: row.id,
    vehicleNumber: row.vehicleNumber,
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
    description: row.description ?? "",
    sellerId: row.sellerId,
    sellerType: row.sellerType,
    status: row.status,
    featuredUntil: row.featuredUntil?.toISOString() ?? null,
    mutedReason: row.mutedReason ?? null,
    deletedAt: row.deletedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
  if (isPrivateListingPastTtl(listing)) {
    listing.status = "expired";
  }
  return listing;
}

export function mapPrismaDealer(row: DealerMapperInput): Dealer {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logoUrl,
    districts: (row.districts ?? []) as MalawiDistrict[],
    verified: row.verified,
    phone: row.phone,
    whatsapp: row.whatsapp,
    description: row.description ?? "",
    userId: row.userId,
  };
}

export function dealerFromSeller(
  seller: { dealer: DealerMapperInput | null } | null | undefined,
  sellerType: Listing["sellerType"],
): Dealer | undefined {
  if (sellerType !== "dealer" || !seller?.dealer) return undefined;
  return mapPrismaDealer(seller.dealer);
}
