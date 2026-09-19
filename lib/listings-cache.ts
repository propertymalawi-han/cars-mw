import { revalidatePath, revalidateTag } from "next/cache";

export const LISTINGS_CACHE_TAG = "listings";
export const DEALERS_CACHE_TAG = "dealers";
export const VEHICLE_CATALOG_CACHE_TAG = "vehicle-catalog";

export function revalidateListingsCache() {
  revalidateTag(LISTINGS_CACHE_TAG);
  revalidateTag(DEALERS_CACHE_TAG);
  revalidatePath("/");
  revalidatePath("/listings");
}

export function revalidateVehicleCatalogCache() {
  revalidateTag(VEHICLE_CATALOG_CACHE_TAG);
  revalidateListingsCache();
  revalidatePath("/admin/vehicle-data");
  revalidatePath("/sell");
}
