import type { FuelType, Prisma } from "@prisma/client";
import type { ListingFilters } from "@/lib/listing-filters";
import { principalFromMonthlyPayment } from "@/lib/finance";
import { listingExpiryCutoff } from "@/lib/listing-expiry";
import {
  DEFAULT_VEHICLE_CATEGORY,
  isDbBodyType,
} from "@/lib/vehicle-search";
import type { BodyType } from "@/types";

export const LISTING_CACHE_REVALIDATE_SECONDS = 60;

export const dealerCardSelect = {
  id: true,
  name: true,
  slug: true,
  logoUrl: true,
  districts: true,
  verified: true,
  phone: true,
  whatsapp: true,
  description: true,
  userId: true,
} satisfies Prisma.DealerSelect;

export const listingCardSelect = {
  id: true,
  vehicleNumber: true,
  title: true,
  make: true,
  model: true,
  year: true,
  price: true,
  mileage: true,
  transmission: true,
  fuelType: true,
  bodyType: true,
  district: true,
  city: true,
  images: true,
  sellerId: true,
  sellerType: true,
  status: true,
  featuredUntil: true,
  createdAt: true,
  seller: {
    select: {
      dealer: { select: dealerCardSelect },
    },
  },
} satisfies Prisma.ListingSelect;

export type ListingCardRow = Prisma.ListingGetPayload<{
  select: typeof listingCardSelect;
}>;

export function activeListingWhere(now = new Date()): Prisma.ListingWhereInput {
  return {
    status: "active",
    OR: [{ sellerType: "dealer" }, { createdAt: { gte: listingExpiryCutoff(now) } }],
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

export function resolvedBodyTypes(
  filters: ListingFilters,
): BodyType[] | "none" | "all" {
  if (filters.category !== DEFAULT_VEHICLE_CATEGORY) return "none";
  if (filters.bodyTypes.length === 0) return "all";
  const dbBodies = filters.bodyTypes.filter(isDbBodyType);
  if (dbBodies.length === 0) return "none";
  return dbBodies;
}

export function listingFilterWhere(
  filters: ListingFilters,
  now = new Date(),
): Prisma.ListingWhereInput | null {
  const bodies = resolvedBodyTypes(filters);
  if (bodies === "none") return null;

  const clauses: Prisma.ListingWhereInput[] = [activeListingWhere(now)];

  const search = filters.q?.replace(/[%_,]/g, " ").trim();
  if (search) {
    const tokens = search.split(/\s+/).filter(Boolean).slice(0, 6);
    for (const token of tokens) {
      clauses.push({
        OR: [
          { title: { contains: token, mode: "insensitive" } },
          { make: { contains: token, mode: "insensitive" } },
          { model: { contains: token, mode: "insensitive" } },
        ],
      });
    }
  }

  const makeClauses: Prisma.ListingWhereInput[] = [];
  for (const make of filters.makes) {
    makeClauses.push({ make: { equals: make, mode: "insensitive" } });
  }
  for (const model of filters.models) {
    makeClauses.push({
      AND: [
        { make: { equals: model.make, mode: "insensitive" } },
        { model: { equals: model.model, mode: "insensitive" } },
      ],
    });
  }
  for (const variant of filters.variants) {
    const titleNeedle = variant.variant.replace(/[%_,]/g, " ").trim();
    if (!titleNeedle) continue;
    makeClauses.push({
      AND: [
        { make: { equals: variant.make, mode: "insensitive" } },
        { model: { equals: variant.model, mode: "insensitive" } },
        { title: { contains: titleNeedle, mode: "insensitive" } },
      ],
    });
  }
  if (makeClauses.length > 0) clauses.push({ OR: makeClauses });

  if (filters.districts.length === 1) {
    clauses.push({ district: filters.districts[0] });
  } else if (filters.districts.length > 1) {
    clauses.push({ district: { in: [...filters.districts] } });
  }

  if (bodies !== "all") {
    clauses.push(
      bodies.length === 1
        ? { bodyType: bodies[0] }
        : { bodyType: { in: bodies } },
    );
  }

  if (filters.transmission) clauses.push({ transmission: filters.transmission });
  if (filters.sellerType) clauses.push({ sellerType: filters.sellerType });
  if (filters.fuelTypes.length === 1) {
    clauses.push({ fuelType: filters.fuelTypes[0] as FuelType });
  } else if (filters.fuelTypes.length > 1) {
    clauses.push({ fuelType: { in: filters.fuelTypes as FuelType[] } });
  }

  const { minPrice, maxPrice } = resolvedPriceRange(filters);
  const price: Prisma.IntFilter = {};
  if (minPrice != null) price.gte = minPrice;
  if (maxPrice != null) price.lte = maxPrice;
  if (Object.keys(price).length > 0) clauses.push({ price });

  const year: Prisma.IntFilter = {};
  if (filters.minYear != null) year.gte = filters.minYear;
  if (filters.maxYear != null) year.lte = filters.maxYear;
  if (Object.keys(year).length > 0) clauses.push({ year });

  const mileage: Prisma.IntFilter = {};
  if (filters.minMileage != null) mileage.gte = filters.minMileage;
  if (filters.maxMileage != null) mileage.lte = filters.maxMileage;
  if (Object.keys(mileage).length > 0) clauses.push({ mileage });

  if (filters.condition === "new") {
    clauses.push({ year: { gte: new Date().getFullYear() } });
  } else if (filters.condition === "used") {
    clauses.push({ year: { lt: new Date().getFullYear() } });
  }

  return { AND: clauses };
}

export function featuredListingWhere(
  filters: ListingFilters,
  now = new Date(),
): Prisma.ListingWhereInput | null {
  const where = listingFilterWhere(filters, now);
  if (!where) return null;
  return { AND: [where, { featuredUntil: { gt: now } }] };
}

export function regularListingWhere(
  filters: ListingFilters,
  now = new Date(),
): Prisma.ListingWhereInput | null {
  const where = listingFilterWhere(filters, now);
  if (!where) return null;
  return {
    AND: [where, { OR: [{ featuredUntil: null }, { featuredUntil: { lte: now } }] }],
  };
}
