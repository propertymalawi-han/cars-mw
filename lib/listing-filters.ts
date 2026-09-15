import {
  BODY_TYPES,
  MALAWI_CITIES,
  MALAWI_DISTRICTS,
  TRANSMISSIONS,
  type BodyType,
  type MalawiCity,
  type MalawiDistrict,
  type Transmission,
} from "@/types";

export const LISTINGS_PAGE_SIZE = 12;
export const PRICE_MIN_MWK = 0;
export const PRICE_MAX_MWK = 50_000_000;
export const PRICE_STEP_MWK = 500_000;

export type SearchParamValue = string | string[] | undefined;

export type ListingSearchParams = {
  q?: SearchParamValue;
  make?: SearchParamValue;
  body?: SearchParamValue;
  district?: SearchParamValue;
  city?: SearchParamValue;
  minPrice?: SearchParamValue;
  maxPrice?: SearchParamValue;
  transmission?: SearchParamValue;
  page?: SearchParamValue;
};

export type ListingFilters = {
  q?: string;
  make?: string;
  body: BodyType[];
  district?: MalawiDistrict;
  city?: MalawiCity;
  minPrice?: number;
  maxPrice?: number;
  transmission?: Transmission;
  page: number;
};

function first(value?: SearchParamValue): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function many(value?: SearchParamValue): string[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value : [value];
  return raw.flatMap((item) => item.split(",")).map((item) => item.trim()).filter(Boolean);
}

export function parsePriceParam(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value.replace(/,/g, "").trim());
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return Math.round(parsed);
}

function asBodyType(value: string): BodyType | undefined {
  return BODY_TYPES.includes(value as BodyType) ? (value as BodyType) : undefined;
}

function asDistrict(value?: string): MalawiDistrict | undefined {
  if (!value) return undefined;
  return MALAWI_DISTRICTS.includes(value as MalawiDistrict)
    ? (value as MalawiDistrict)
    : undefined;
}

function asCity(value?: string): MalawiCity | undefined {
  if (!value) return undefined;
  return MALAWI_CITIES.includes(value as MalawiCity) ? (value as MalawiCity) : undefined;
}

function asTransmission(value?: string): Transmission | undefined {
  if (!value) return undefined;
  return TRANSMISSIONS.includes(value as Transmission)
    ? (value as Transmission)
    : undefined;
}

export function parseListingSearchParams(
  searchParams: ListingSearchParams = {},
): ListingFilters {
  const body = Array.from(
    new Set(many(searchParams.body).map(asBodyType).filter(Boolean)),
  ) as BodyType[];

  let minPrice = parsePriceParam(first(searchParams.minPrice));
  let maxPrice = parsePriceParam(first(searchParams.maxPrice));

  if (minPrice != null) minPrice = Math.min(Math.max(minPrice, PRICE_MIN_MWK), PRICE_MAX_MWK);
  if (maxPrice != null) maxPrice = Math.min(Math.max(maxPrice, PRICE_MIN_MWK), PRICE_MAX_MWK);
  if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }
  if (minPrice === PRICE_MIN_MWK) minPrice = undefined;
  if (maxPrice === PRICE_MAX_MWK) maxPrice = undefined;

  const pageRaw = Number(first(searchParams.page) ?? "1");
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const q = first(searchParams.q)?.trim() || undefined;
  const make = first(searchParams.make)?.trim() || undefined;

  return {
    q,
    make,
    body,
    district: asDistrict(first(searchParams.district)?.trim()),
    city: asCity(first(searchParams.city)?.trim()),
    minPrice,
    maxPrice,
    transmission: asTransmission(first(searchParams.transmission)?.trim()),
    page,
  };
}

export function listingFiltersToSearchParams(filters: ListingFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.make) params.set("make", filters.make);
  for (const body of filters.body) params.append("body", body);
  if (filters.district) params.set("district", filters.district);
  if (filters.city) params.set("city", filters.city);
  if (filters.minPrice != null && filters.minPrice > PRICE_MIN_MWK) {
    params.set("minPrice", String(filters.minPrice));
  }
  if (filters.maxPrice != null && filters.maxPrice < PRICE_MAX_MWK) {
    params.set("maxPrice", String(filters.maxPrice));
  }
  if (filters.transmission) params.set("transmission", filters.transmission);
  if (filters.page > 1) params.set("page", String(filters.page));
  return params;
}

export function listingsHref(filters: ListingFilters): string {
  const query = listingFiltersToSearchParams(filters).toString();
  return query ? `/listings?${query}` : "/listings";
}

export function hasActiveFilters(filters: ListingFilters): boolean {
  return Boolean(
    filters.q ||
      filters.make ||
      filters.body.length > 0 ||
      filters.district ||
      filters.city ||
      filters.minPrice != null ||
      filters.maxPrice != null ||
      filters.transmission,
  );
}
