import { buildListingTitle } from "@/lib/listing-title";
import type { ListingFormValues } from "@/lib/validations/listing";

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
