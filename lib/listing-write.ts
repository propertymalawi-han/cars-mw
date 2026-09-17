import { buildListingTitle } from "@/lib/listing-title";
import { prisma } from "@/lib/prisma";
import type { ListingFormValues } from "@/lib/validations/listing";

const DUPLICATE_WINDOW_MS = 2 * 60 * 1000;

export function listingWriteData(data: ListingFormValues) {
  return {
    title: buildListingTitle(data),
    make: data.make,
    model: data.model,
    year: data.year,
    price: data.price,
    mileage: data.mileage,
    transmission: data.transmission,
    fuelType: data.fuelType,
    bodyType: data.bodyType,
    district: data.district,
    city: data.city,
    images: data.images,
    description: data.description,
  };
}

export async function findRecentDuplicateListing(
  sellerId: string,
  data: Pick<ListingFormValues, "make" | "model" | "year" | "price" | "mileage">,
) {
  return prisma.listing.findFirst({
    where: {
      sellerId,
      make: data.make,
      model: data.model,
      year: data.year,
      price: data.price,
      mileage: data.mileage,
      createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
}
