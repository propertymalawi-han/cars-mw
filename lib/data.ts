import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getSupabase } from "@/lib/supabase/server";
import {
  defaultListingFilters,
  facetFiltersKey,
  filtersKey,
  LISTINGS_PAGE_SIZE,
  parseListingSearchParams,
  type ListingFilters,
} from "@/lib/listing-filters";
import { principalFromMonthlyPayment } from "@/lib/finance";
import { prisma } from "@/lib/prisma";
import { dealerFromSeller, mapPrismaDealer, mapPrismaListing } from "@/lib/prisma-mappers";
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
  emptyCategoryCounts,
  type CategoryCounts,
} from "@/lib/vehicle-search";
import {
  isPrivateListingPastTtl,
  privateListingFreshnessOrFilter,
} from "@/lib/listing-expiry";
import {
  activeListingWhere,
  dealerCardSelect,
  featuredListingWhere,
  LISTING_CACHE_REVALIDATE_SECONDS,
  listingCardSelect,
  listingFilterWhere,
  regularListingWhere,
  resolvedBodyTypes,
  type ListingCardRow,
} from "@/lib/listing-query";

function mapListing(row: Omit<ListingRow, "description"> & { description?: string }): Listing {
  return {
    id: row.id,
    vehicleNumber: row.vehicle_number,
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
    description: row.description ?? "",
    sellerId: row.seller_id,
    sellerType: row.seller_type,
    status: row.status,
    featuredUntil: row.featured_until,
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
    description: row.description ?? "",
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

function usePrisma() {
  return Boolean(process.env.DATABASE_URL);
}

function listingsFromCardRows(rows: ListingCardRow[]): Listing[] {
  return rows.map(mapPrismaListing);
}

function dealersFromCardRows(rows: ListingCardRow[]): Dealer[] {
  const byId = new Map<string, Dealer>();
  for (const row of rows) {
    const dealer = dealerFromSeller(row.seller, row.sellerType);
    if (dealer && !byId.has(dealer.id)) byId.set(dealer.id, dealer);
  }
  return Array.from(byId.values());
}

export function dealerForListing(listing: Listing, dealers: Dealer[]) {
  if (listing.sellerType !== "dealer") return undefined;
  return dealers.find((dealer) => dealer.userId === listing.sellerId);
}

async function loadDealers(): Promise<Dealer[]> {
  if (usePrisma()) {
    const rows = await prisma.dealer.findMany({
      orderBy: { name: "asc" },
      select: dealerCardSelect,
    });
    return rows.map(mapPrismaDealer);
  }

  const { data, error } = await getSupabase()
    .from("dealers")
    .select("id, name, slug, logo_url, districts, verified, phone, whatsapp, description, user_id")
    .order("name", { ascending: true });

  throwIfError("Failed to load dealers", error);
  return (data ?? []).map(mapDealer);
}

export const getDealers = unstable_cache(loadDealers, ["dealers"], {
  revalidate: LISTING_CACHE_REVALIDATE_SECONDS,
});

export const getDealerBySlug = cache(async (slug: string): Promise<Dealer | undefined> => {
  if (usePrisma()) {
    const row = await prisma.dealer.findUnique({
      where: { slug },
      select: dealerCardSelect,
    });
    return row ? mapPrismaDealer(row) : undefined;
  }

  const { data, error } = await getSupabase()
    .from("dealers")
    .select("id, name, slug, logo_url, districts, verified, phone, whatsapp, description, user_id")
    .eq("slug", slug)
    .maybeSingle();

  throwIfError("Failed to load dealer", error);
  return data ? mapDealer(data) : undefined;
});

export const getDealerForListing = cache(async (listing: Listing): Promise<Dealer | undefined> => {
  if (listing.sellerType !== "dealer") return undefined;

  if (usePrisma()) {
    const row = await prisma.dealer.findUnique({
      where: { userId: listing.sellerId },
      select: dealerCardSelect,
    });
    return row ? mapPrismaDealer(row) : undefined;
  }

  const { data, error } = await getSupabase()
    .from("dealers")
    .select("id, name, slug, logo_url, districts, verified, phone, whatsapp, description, user_id")
    .eq("user_id", listing.sellerId)
    .maybeSingle();

  throwIfError("Failed to load listing dealer", error);
  return data ? mapDealer(data) : undefined;
});

export const getListingById = cache(async (id: string): Promise<Listing | undefined> => {
  if (usePrisma()) {
    const row = await prisma.listing.findUnique({ where: { id } });
    if (!row || row.status === "draft") return undefined;
    const listing = mapPrismaListing(row);
    if (isPrivateListingPastTtl(listing)) {
      listing.status = "expired";
    }
    return listing;
  }

  const { data, error } = await getSupabase()
    .from("listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  throwIfError("Failed to load listing", error);
  if (!data) return undefined;

  const listing = mapListing(data);
  if (isPrivateListingPastTtl(listing)) {
    listing.status = "expired";
  }
  return listing;
});

export async function getSellerContact(
  id: string,
): Promise<{ name: string; phone: string | null } | undefined> {
  if (usePrisma()) {
    const row = await prisma.user.findUnique({
      where: { id },
      select: { name: true, phone: true },
    });
    return row ?? undefined;
  }

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
): Promise<{ listings: Listing[]; dealers: Dealer[] }> {
  if (usePrisma()) {
    const rows = await prisma.listing.findMany({
      where: {
        AND: [
          activeListingWhere(),
          { id: { not: listing.id } },
          { OR: [{ make: listing.make }, { district: listing.district }] },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: listingCardSelect,
    });
    const ranked = rows
      .map((row) => ({ row, score: relatedScore(listing, mapPrismaListing(row)) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.row);
    return {
      listings: listingsFromCardRows(ranked),
      dealers: dealersFromCardRows(ranked),
    };
  }

  const { data, error } = await getSupabase()
    .from("listings")
    .select(
      "id, vehicle_number, title, make, model, year, price, mileage, transmission, fuel_type, body_type, district, city, images, seller_id, seller_type, status, featured_until, created_at, description",
    )
    .eq("status", "active")
    .or(privateListingFreshnessOrFilter())
    .neq("id", listing.id)
    .or(`make.eq.${listing.make},district.eq.${listing.district}`)
    .order("created_at", { ascending: false })
    .limit(12);

  throwIfError("Failed to load related listings", error);

  const listings = (data ?? [])
    .map(mapListing)
    .sort((a, b) => relatedScore(listing, b) - relatedScore(listing, a))
    .slice(0, limit);
  return { listings, dealers: [] };
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
  return getListingsForSeller(dealer.userId);
}

export async function getListingsForSeller(sellerId: string): Promise<Listing[]> {
  if (usePrisma()) {
    const now = new Date();
    const rows = await prisma.listing.findMany({
      where: {
        AND: [activeListingWhere(now), { sellerId, sellerType: "dealer" }],
      },
      orderBy: [{ featuredUntil: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      select: listingCardSelect,
    });
    return sortFeaturedFirst(listingsFromCardRows(rows), now.toISOString());
  }

  const now = new Date().toISOString();
  const { data, error } = await getSupabase()
    .from("listings")
    .select(
      "id, vehicle_number, title, make, model, year, price, mileage, transmission, fuel_type, body_type, district, city, images, seller_id, seller_type, status, featured_until, created_at",
    )
    .eq("seller_id", sellerId)
    .eq("seller_type", "dealer")
    .eq("status", "active")
    .order("featured_until", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  throwIfError("Failed to load dealer listings", error);
  return sortFeaturedFirst((data ?? []).map(mapListing), now);
}

export async function getFeaturedListings(bodyType?: string): Promise<{
  listings: Listing[];
  dealers: Dealer[];
}> {
  const selectedBody = asBodyType(bodyType);
  const limit = 6;

  if (usePrisma()) {
    const now = new Date();
    const baseWhere = {
      AND: [
        activeListingWhere(now),
        ...(selectedBody ? [{ bodyType: selectedBody }] : []),
      ],
    };
    const [featuredRows, fallbackRows] = await Promise.all([
      prisma.listing.findMany({
        where: { AND: [baseWhere, { featuredUntil: { gt: now } }] },
        orderBy: { featuredUntil: "desc" },
        take: limit,
        select: listingCardSelect,
      }),
      prisma.listing.findMany({
        where: baseWhere,
        orderBy: { createdAt: "desc" },
        take: limit * 2,
        select: listingCardSelect,
      }),
    ]);

    const merged: ListingCardRow[] = [...featuredRows];
    const seen = new Set(featuredRows.map((row) => row.id));
    for (const row of fallbackRows) {
      if (seen.has(row.id)) continue;
      merged.push(row);
      if (merged.length >= limit) break;
    }
    const rows = merged.slice(0, limit);
    return {
      listings: listingsFromCardRows(rows),
      dealers: dealersFromCardRows(rows),
    };
  }

  const now = new Date().toISOString();

  let featuredQuery = getSupabase()
    .from("listings")
    .select(
      "id, vehicle_number, title, make, model, year, price, mileage, transmission, fuel_type, body_type, district, city, images, seller_id, seller_type, status, featured_until, created_at",
    )
    .eq("status", "active")
    .or(privateListingFreshnessOrFilter(new Date(now)))
    .gt("featured_until", now)
    .order("featured_until", { ascending: false })
    .limit(limit);

  if (selectedBody) {
    featuredQuery = featuredQuery.eq("body_type", selectedBody);
  }

  let fallbackQuery = getSupabase()
    .from("listings")
    .select(
      "id, vehicle_number, title, make, model, year, price, mileage, transmission, fuel_type, body_type, district, city, images, seller_id, seller_type, status, featured_until, created_at",
    )
    .eq("status", "active")
    .or(privateListingFreshnessOrFilter(new Date(now)))
    .order("created_at", { ascending: false })
    .limit(limit * 2);

  if (selectedBody) {
    fallbackQuery = fallbackQuery.eq("body_type", selectedBody);
  }

  const [featuredResult, fallbackResult] = await Promise.all([featuredQuery, fallbackQuery]);
  throwIfError("Failed to load featured listings", featuredResult.error);
  throwIfError("Failed to load featured listings", fallbackResult.error);

  const featured = (featuredResult.data ?? []).map(mapListing);
  if (featured.length >= limit) {
    return { listings: featured.slice(0, limit), dealers: [] };
  }

  const seen = new Set(featured.map((listing) => listing.id));
  for (const listing of (fallbackResult.data ?? []).map(mapListing)) {
    if (seen.has(listing.id)) continue;
    featured.push(listing);
    if (featured.length >= limit) break;
  }
  return { listings: featured, dealers: [] };
}

export async function getMakes(): Promise<string[]> {
  const facets = await getMakeModelFacets(defaultListingFilters());
  return facets.map((facet) => facet.make);
}

async function loadMakeModelFacets(filters: ListingFilters): Promise<MakeFacet[]> {
  if (resolvedBodyTypes(filters) === "none") return [];

  if (usePrisma()) {
    const where = listingFilterWhere(filters);
    if (!where) return [];
    const rows = await prisma.listing.groupBy({
      by: ["make", "model", "title"],
      where,
      _count: { _all: true },
    });
    return aggregateMakeFacets(
      rows.map((row) => ({
        make: row.make,
        model: row.model,
        title: row.title,
        count: row._count._all,
      })),
    );
  }

  const facetFilters: ListingFilters = {
    ...filters,
    q: undefined,
    makes: [],
    models: [],
    variants: [],
    page: 1,
  };
  const rows: ListingMakeRow[] = [];
  let from = 0;
  const FACET_PAGE_SIZE = 1000;
  for (;;) {
    const query = applyListingFilters(
      getSupabase()
        .from("listings")
        .select("make, model, title")
        .eq("status", "active")
        .or(privateListingFreshnessOrFilter())
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

const loadCachedMakeModelFacets = unstable_cache(
  async (key: string) => {
    const filters = parseListingSearchParams(Object.fromEntries(new URLSearchParams(key)));
    return loadMakeModelFacets(filters);
  },
  ["make-model-facets"],
  { revalidate: LISTING_CACHE_REVALIDATE_SECONDS },
);

export function getMakeModelFacets(filters: ListingFilters): Promise<MakeFacet[]> {
  return loadCachedMakeModelFacets(facetFiltersKey(filters));
}

export type ListingSearchResult = {
  listings: Listing[];
  dealers: Dealer[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function emptySearchResult(page: number): ListingSearchResult {
  return {
    listings: [],
    dealers: [],
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

  next = next.or(privateListingFreshnessOrFilter());

  return next as T;
}

async function loadListingCount(filters: ListingFilters): Promise<number> {
  if (resolvedBodyTypes(filters) === "none") return 0;

  if (usePrisma()) {
    const where = listingFilterWhere(filters);
    if (!where) return 0;
    return prisma.listing.count({ where });
  }

  const query = applyListingFilters(
    getSupabase()
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .or(privateListingFreshnessOrFilter()),
    filters,
  );
  const { count, error } = await query;
  throwIfError("Failed to count listings", error);
  return count ?? 0;
}

const loadCachedListingCount = unstable_cache(
  async (key: string) => {
    const filters = parseListingSearchParams(Object.fromEntries(new URLSearchParams(key)));
    return loadListingCount(filters);
  },
  ["listing-count"],
  { revalidate: LISTING_CACHE_REVALIDATE_SECONDS },
);

export function countListings(filters: ListingFilters): Promise<number> {
  return loadCachedListingCount(filtersKey(filters));
}

async function loadCategoryCounts(): Promise<CategoryCounts> {
  const counts = emptyCategoryCounts();
  counts.cars = await loadListingCount(defaultListingFilters());
  return counts;
}

export const getCategoryCounts = unstable_cache(loadCategoryCounts, ["category-counts"], {
  revalidate: LISTING_CACHE_REVALIDATE_SECONDS,
});

export type DistrictCount = {
  district: string;
  count: number;
};

async function loadDistrictCounts(): Promise<DistrictCount[]> {
  if (usePrisma()) {
    const rows = await prisma.listing.groupBy({
      by: ["district"],
      where: activeListingWhere(),
      _count: { _all: true },
    });
    return rows
      .map((row) => ({ district: row.district, count: row._count._all }))
      .sort((a, b) => b.count - a.count || a.district.localeCompare(b.district));
  }

  const { data, error } = await getSupabase()
    .from("listings")
    .select("district")
    .eq("status", "active")
    .or(privateListingFreshnessOrFilter());
  throwIfError("Failed to load district counts", error);
  const tally = new Map<string, number>();
  for (const row of data ?? []) {
    tally.set(row.district, (tally.get(row.district) ?? 0) + 1);
  }
  return Array.from(tally.entries())
    .map(([district, count]) => ({ district, count }))
    .sort((a, b) => b.count - a.count || a.district.localeCompare(b.district));
}

export const getDistrictCounts = unstable_cache(loadDistrictCounts, ["district-counts"], {
  revalidate: LISTING_CACHE_REVALIDATE_SECONDS,
});

function sortFeaturedFirst(listings: Listing[], nowIso: string) {
  return [...listings].sort((a, b) => {
    const aFeatured = a.featuredUntil && a.featuredUntil > nowIso ? 1 : 0;
    const bFeatured = b.featuredUntil && b.featuredUntil > nowIso ? 1 : 0;
    if (aFeatured !== bFeatured) return bFeatured - aFeatured;
    if (aFeatured && bFeatured) {
      return (b.featuredUntil ?? "").localeCompare(a.featuredUntil ?? "");
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
}

const LISTING_CARD_COLUMNS =
  "id, vehicle_number, title, make, model, year, price, mileage, transmission, fuel_type, body_type, district, city, images, seller_id, seller_type, status, featured_until, created_at";

async function searchListingSlice(
  filters: ListingFilters,
  mode: "featured" | "regular",
  from: number,
  to: number,
): Promise<{ listings: Listing[]; count: number }> {
  const now = new Date().toISOString();
  const base = getSupabase()
    .from("listings")
    .select(LISTING_CARD_COLUMNS, { count: "exact" })
    .eq("status", "active")
    .or(privateListingFreshnessOrFilter());

  const scoped =
    mode === "featured"
      ? base.gt("featured_until", now).order("featured_until", { ascending: false })
      : base
          .or(`featured_until.is.null,featured_until.lte.${now}`)
          .order("created_at", { ascending: false });

  const query = applyListingFilters(scoped, filters);
  const { data, error, count } = await query.range(from, to);
  throwIfError("Failed to search listings", error);
  return { listings: (data ?? []).map(mapListing), count: count ?? 0 };
}

async function searchListingsPrisma(filters: ListingFilters): Promise<ListingSearchResult> {
  const pageSize = LISTINGS_PAGE_SIZE;
  const page = filters.page;
  const from = (page - 1) * pageSize;
  const now = new Date();
  const featuredWhere = featuredListingWhere(filters, now);
  const regularWhere = regularListingWhere(filters, now);
  if (!featuredWhere || !regularWhere) return emptySearchResult(page);

  if (from === 0) {
    const [featuredCount, regularCount, featuredRows, regularRows] = await Promise.all([
      prisma.listing.count({ where: featuredWhere }),
      prisma.listing.count({ where: regularWhere }),
      prisma.listing.findMany({
        where: featuredWhere,
        orderBy: { featuredUntil: "desc" },
        take: pageSize,
        select: listingCardSelect,
      }),
      prisma.listing.findMany({
        where: regularWhere,
        orderBy: { createdAt: "desc" },
        take: pageSize,
        select: listingCardSelect,
      }),
    ]);
    const total = featuredCount + regularCount;
    const featuredOnPage = featuredRows.slice(0, Math.min(pageSize, featuredCount));
    const remaining = pageSize - featuredOnPage.length;
    const rows = [...featuredOnPage, ...regularRows.slice(0, remaining)];
    return {
      listings: listingsFromCardRows(rows),
      dealers: dealersFromCardRows(rows),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  const [featuredCount, regularCount] = await Promise.all([
    prisma.listing.count({ where: featuredWhere }),
    prisma.listing.count({ where: regularWhere }),
  ]);

  const total = featuredCount + regularCount;
  const featuredTake = Math.max(0, Math.min(pageSize, featuredCount - from));
  const remaining = pageSize - featuredTake;
  const regularFrom = Math.max(0, from - featuredCount);

  const [featuredRows, regularRows] = await Promise.all([
    featuredTake > 0
      ? prisma.listing.findMany({
          where: featuredWhere,
          orderBy: { featuredUntil: "desc" },
          skip: from,
          take: featuredTake,
          select: listingCardSelect,
        })
      : Promise.resolve([]),
    remaining > 0 && regularCount > regularFrom
      ? prisma.listing.findMany({
          where: regularWhere,
          orderBy: { createdAt: "desc" },
          skip: regularFrom,
          take: remaining,
          select: listingCardSelect,
        })
      : Promise.resolve([]),
  ]);

  const rows = [...featuredRows, ...regularRows];
  return {
    listings: listingsFromCardRows(rows),
    dealers: dealersFromCardRows(rows),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function searchListings(
  filters: ListingFilters,
): Promise<ListingSearchResult> {
  if (resolvedBodyTypes(filters) === "none") {
    return emptySearchResult(filters.page);
  }

  if (usePrisma()) {
    return searchListingsPrisma(filters);
  }

  const pageSize = LISTINGS_PAGE_SIZE;
  const from = (filters.page - 1) * pageSize;
  const to = from + pageSize - 1;
  const [featured, regular] = await Promise.all([
    searchListingSlice(filters, "featured", from, to),
    searchListingSlice(filters, "regular", from, to),
  ]);

  const total = featured.count + regular.count;
  const featuredOnPage =
    from >= featured.count ? [] : featured.listings.slice(0, pageSize);
  const remaining = pageSize - featuredOnPage.length;
  const regularOnPage = remaining > 0 ? regular.listings.slice(0, remaining) : [];
  const listings = [...featuredOnPage, ...regularOnPage];

  return {
    listings,
    dealers: [],
    total,
    page: filters.page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
