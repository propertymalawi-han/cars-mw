import { getSupabase } from "@/lib/supabase/server";
import type { ListingFilters } from "@/lib/listing-filters";
import { LISTINGS_PAGE_SIZE } from "@/lib/listing-filters";
import type { DealerRow, ListingRow } from "@/types/database";
import type {
  BodyType,
  Dealer,
  Listing,
  MalawiCity,
  MalawiDistrict,
} from "@/types";
import { BODY_TYPES } from "@/types";

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
  const { data, error } = await getSupabase()
    .from("listings")
    .select("make")
    .eq("status", "active");

  throwIfError("Failed to load makes", error);
  return Array.from(new Set((data ?? []).map((row) => row.make))).sort();
}

export type ListingSearchResult = {
  listings: Listing[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function searchListings(
  filters: ListingFilters,
): Promise<ListingSearchResult> {
  let query = getSupabase()
    .from("listings")
    .select("*", { count: "exact" })
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const search = filters.q?.replace(/[%_,]/g, " ");
  if (search) {
    query = query.or(
      `title.ilike.%${search}%,make.ilike.%${search}%,model.ilike.%${search}%`,
    );
  }

  if (filters.city) query = query.eq("city", filters.city);
  if (filters.district) query = query.eq("district", filters.district);
  if (filters.make) query = query.ilike("make", filters.make);
  if (filters.body.length === 1) {
    query = query.eq("body_type", filters.body[0]);
  } else if (filters.body.length > 1) {
    query = query.in("body_type", filters.body);
  }
  if (filters.transmission) query = query.eq("transmission", filters.transmission);
  if (filters.minPrice != null) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice != null) query = query.lte("price", filters.maxPrice);

  const pageSize = LISTINGS_PAGE_SIZE;
  const from = (filters.page - 1) * pageSize;
  const to = from + pageSize - 1;

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
