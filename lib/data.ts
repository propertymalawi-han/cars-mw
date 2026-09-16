import { getSupabase } from "@/lib/supabase/server";
import { defaultListingFilters, type ListingFilters } from "@/lib/listing-filters";
import { LISTINGS_PAGE_SIZE } from "@/lib/listing-filters";
import { principalFromMonthlyPayment } from "@/lib/finance";
import type { DealerRow, ListingRow } from "@/types/database";
import type {
  BodyType,
  Dealer,
  Listing,
  MalawiCity,
  MalawiDistrict,
} from "@/types";
import { BODY_TYPES } from "@/types";
import {
  aggregateMakeFacets,
  type ListingMakeRow,
  type MakeFacet,
} from "@/lib/make-picker";
import {
  DEFAULT_VEHICLE_CATEGORY,
  emptyCategoryCounts,
  isDbBodyType,
  type CategoryCounts,
} from "@/lib/vehicle-search";

function mapListing(row: ListingRow): Listing {
  return {
    id: row.id,
    title: row.title,
    make: row.make,
    model: row.model,
    year: row.year,
    price: row.price,
    mileage: row.mileage,
    transmission: row.transmission,
    fuelType: row.fuel_type,
    bodyType: row.body_type,
    district: row.district as MalawiDistrict,
    city: row.city as MalawiCity,
    images: row.images ?? [],
    description: row.description,
    sellerId: row.seller_id,
    sellerType: row.seller_type,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapDealer(row: DealerRow): Dealer {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url,
    districts: (row.districts ?? []) as MalawiDistrict[],
    verified: row.verified,
    phone: row.phone,
    whatsapp: row.whatsapp,
    userId: row.user_id,
  };
}

function asBodyType(value?: string): BodyType | undefined {
  if (!value) return undefined;
  return BODY_TYPES.includes(value as BodyType) ? (value as BodyType) : undefined;
}

function throwIfError(message: string, error: { message: string } | null) {
  if (error) {
    console.error(`${message}: ${error.message}`);
    throw new Error(`${message}: ${error.message}`);
  }
}

export function dealerForListing(listing: Listing, dealers: Dealer[]) {
  if (listing.sellerType !== "dealer") return undefined;
  return dealers.find((dealer) => dealer.userId === listing.sellerId);
}

export async function getDealers(): Promise<Dealer[]> {
  const { data, error } = await getSupabase()
    .from("dealers")
    .select("*")
    .order("name", { ascending: true });

  throwIfError("Failed to load dealers", error);
  return (data ?? []).map(mapDealer);
}

export async function getDealerBySlug(slug: string): Promise<Dealer | undefined> {
  const { data, error } = await getSupabase()
    .from("dealers")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  throwIfError("Failed to load dealer", error);
  return data ? mapDealer(data) : undefined;
}

export async function getDealerForListing(
  listing: Listing,
): Promise<Dealer | undefined> {
  if (listing.sellerType !== "dealer") return undefined;

  const { data, error } = await getSupabase()
    .from("dealers")
    .select("*")
    .eq("user_id", listing.sellerId)
    .maybeSingle();

  throwIfError("Failed to load listing dealer", error);
  return data ? mapDealer(data) : undefined;
}

export async function getListingById(id: string): Promise<Listing | undefined> {
  const { data, error } = await getSupabase()
    .from("listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  throwIfError("Failed to load listing", error);
  return data ? mapListing(data) : undefined;
}

export async function getSellerContact(
  id: string,
): Promise<{ name: string; phone: string } | undefined> {
  const { data, error } = await getSupabase()
    .from("users")
    .select("name, phone")
    .eq("id", id)
    .maybeSingle();

  throwIfError("Failed to load seller", error);
  return data ?? undefined;
}

export async function getRelatedListings(
  listing: Listing,
  limit = 3,
): Promise<Listing[]> {
  const { data, error } = await getSupabase()
    .from("listings")
    .select("*")
    .eq("status", "active")
    .neq("id", listing.id)
    .or(`make.eq.${listing.make},district.eq.${listing.district}`)
    .order("created_at", { ascending: false })
    .limit(12);

  throwIfError("Failed to load related listings", error);

  return (data ?? [])
    .map(mapListing)
    .sort((a, b) => relatedScore(listing, b) - relatedScore(listing, a))
    .slice(0, limit);
}

function relatedScore(current: Listing, candidate: Listing) {
  return (
    (candidate.make === current.make ? 2 : 0) +
    (candidate.district === current.district ? 1 : 0)
  );
}

export async function getListingsByDealer(slug: string): Promise<Listing[]> {
  const dealer = await getDealerBySlug(slug);
  if (!dealer) return [];

  const { data, error } = await getSupabase()
    .from("listings")
    .select("*")
    .eq("seller_id", dealer.userId)
    .eq("seller_type", "dealer")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  throwIfError("Failed to load dealer listings", error);
  return (data ?? []).map(mapListing);
}

export async function getFeaturedListings(bodyType?: string): Promise<Listing[]> {
  let query = getSupabase()
    .from("listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(6);

  const selectedBody = asBodyType(bodyType);
  if (selectedBody) {
    query = query.eq("body_type", selectedBody);
  }

  const { data, error } = await query;
  throwIfError("Failed to load featured listings", error);
  return (data ?? []).map(mapListing);
}

export async function getMakes(): Promise<string[]> {
  const facets = await getMakeModelFacets(defaultListingFilters());
  return facets.map((facet) => facet.make);
}

const FACET_PAGE_SIZE = 1000;

export async function getMakeModelFacets(filters: ListingFilters): Promise<MakeFacet[]> {
  const facetFilters: ListingFilters = {
    ...filters,
    q: undefined,
    makes: [],
    models: [],
    variants: [],
    page: 1,
  };
  if (resolvedBodyTypes(facetFilters) === "none") return [];

  const rows: ListingMakeRow[] = [];
  let from = 0;
  for (;;) {
    const query = applyListingFilters(
      getSupabase()
        .from("listings")
        .select("make, model, title")
        .eq("status", "active")
        .order("id", { ascending: true }),
      facetFilters,
    );
    const { data, error } = await query.range(from, from + FACET_PAGE_SIZE - 1);
    throwIfError("Failed to load make counts", error);
    const batch = (data ?? []) as ListingMakeRow[];
    rows.push(...batch);
    if (batch.length < FACET_PAGE_SIZE) break;
    from += FACET_PAGE_SIZE;
  }

  return aggregateMakeFacets(rows);
}

export type ListingSearchResult = {
  listings: Listing[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function emptySearchResult(page: number): ListingSearchResult {
  return {
    listings: [],
    total: 0,
    page,
    pageSize: LISTINGS_PAGE_SIZE,
    totalPages: 1,
  };
}

function resolvedPriceRange(filters: ListingFilters): {
  minPrice?: number;
  maxPrice?: number;
} {
  if (filters.pricing === "finance") {
    return {
      minPrice:
        filters.minInstalment != null
          ? (principalFromMonthlyPayment(filters.minInstalment) ?? undefined)
          : undefined,
      maxPrice:
        filters.maxInstalment != null
          ? (principalFromMonthlyPayment(filters.maxInstalment) ?? undefined)
          : undefined,
    };
  }
  return { minPrice: filters.minPrice, maxPrice: filters.maxPrice };
}

function resolvedBodyTypes(filters: ListingFilters): BodyType[] | "none" | "all" {
  if (filters.category !== DEFAULT_VEHICLE_CATEGORY) return "none";
  if (filters.bodyTypes.length === 0) return "all";
  const dbBodies = filters.bodyTypes.filter(isDbBodyType);
  if (dbBodies.length === 0) return "none";
  return dbBodies;
}

function quoteFilterValue(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function makeModelOrFilter(filters: ListingFilters): string | undefined {
  const clauses: string[] = [];
  for (const make of filters.makes) {
    clauses.push(`make.ilike.${quoteFilterValue(make)}`);
  }
  for (const model of filters.models) {
    clauses.push(
      `and(make.ilike.${quoteFilterValue(model.make)},model.ilike.${quoteFilterValue(model.model)})`,
    );
  }
  for (const variant of filters.variants) {
    const titleNeedle = variant.variant.replace(/[%_,]/g, " ").trim();
    if (!titleNeedle) continue;
    clauses.push(
      `and(make.ilike.${quoteFilterValue(variant.make)},model.ilike.${quoteFilterValue(variant.model)},title.ilike.${quoteFilterValue(`%${titleNeedle}`)})`,
    );
  }
  return clauses.length > 0 ? clauses.join(",") : undefined;
}

function applyListingFilters<T>(query: T, filters: ListingFilters): T {
  let next = query as {
    or: (value: string) => typeof next;
    eq: (column: string, value: string) => typeof next;
    in: (column: string, values: string[]) => typeof next;
    gte: (column: string, value: number) => typeof next;
    lte: (column: string, value: number) => typeof next;
    lt: (column: string, value: number) => typeof next;
  };

  const search = filters.q?.replace(/[%_,]/g, " ").trim();
  if (search) {
    const tokens = search.split(/\s+/).filter(Boolean).slice(0, 6);
    for (const token of tokens) {
      next = next.or(
        `title.ilike.%${token}%,make.ilike.%${token}%,model.ilike.%${token}%`,
      );
    }
  }

  const makeFilter = makeModelOrFilter(filters);
  if (makeFilter) next = next.or(makeFilter);

  if (filters.districts.length === 1) {
    next = next.eq("district", filters.districts[0]!);
  } else if (filters.districts.length > 1) {
    next = next.in("district", filters.districts);
  }

  const bodies = resolvedBodyTypes(filters);
  if (bodies !== "all" && bodies !== "none") {
    next =
      bodies.length === 1
        ? next.eq("body_type", bodies[0]!)
        : next.in("body_type", bodies);
  }

  if (filters.transmission) next = next.eq("transmission", filters.transmission);
  if (filters.sellerType) next = next.eq("seller_type", filters.sellerType);
  if (filters.fuelTypes.length === 1) {
    next = next.eq("fuel_type", filters.fuelTypes[0]!);
  } else if (filters.fuelTypes.length > 1) {
    next = next.in("fuel_type", filters.fuelTypes);
  }

  const { minPrice, maxPrice } = resolvedPriceRange(filters);
  if (minPrice != null) next = next.gte("price", minPrice);
  if (maxPrice != null) next = next.lte("price", maxPrice);
  if (filters.minYear != null) next = next.gte("year", filters.minYear);
  if (filters.maxYear != null) next = next.lte("year", filters.maxYear);
  if (filters.minMileage != null) next = next.gte("mileage", filters.minMileage);
  if (filters.maxMileage != null) next = next.lte("mileage", filters.maxMileage);

  if (filters.condition === "new") {
    next = next.gte("year", new Date().getFullYear());
  } else if (filters.condition === "used") {
    next = next.lt("year", new Date().getFullYear());
  }

  return next as T;
}

export async function countListings(filters: ListingFilters): Promise<number> {
  if (resolvedBodyTypes(filters) === "none") return 0;

  const query = applyListingFilters(
    getSupabase()
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    filters,
  );
  const { count, error } = await query;
  throwIfError("Failed to count listings", error);
  return count ?? 0;
}

export async function getCategoryCounts(): Promise<CategoryCounts> {
  const counts = emptyCategoryCounts();
  const { count, error } = await getSupabase()
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  throwIfError("Failed to load category counts", error);
  counts.cars = count ?? 0;
  return counts;
}

export async function searchListings(
  filters: ListingFilters,
): Promise<ListingSearchResult> {
  if (resolvedBodyTypes(filters) === "none") {
    return emptySearchResult(filters.page);
  }

  const pageSize = LISTINGS_PAGE_SIZE;
  const from = (filters.page - 1) * pageSize;
  const to = from + pageSize - 1;

  const query = applyListingFilters(
    getSupabase()
      .from("listings")
      .select("*", { count: "exact" })
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    filters,
  );

  const { data, error, count } = await query.range(from, to);
  throwIfError("Failed to search listings", error);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    listings: (data ?? []).map(mapListing),
    total,
    page: filters.page,
    pageSize,
    totalPages,
  };
}
