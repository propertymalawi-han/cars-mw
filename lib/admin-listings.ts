import type { ListingStatus, Prisma, SellerType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  bodyTypesForCategory,
  isDbBodyType,
  isVehicleCategory,
  type VehicleCategory,
} from "@/lib/vehicle-search";
import { LISTING_STATUSES, type ListingStatus as AppListingStatus, type SellerType as AppSellerType } from "@/types";

export const ADMIN_LISTINGS_PAGE_SIZE = 20;

export const ADMIN_LISTING_SORTS = [
  "title",
  "make",
  "price",
  "seller",
  "status",
  "views",
  "enquiries",
  "createdAt",
] as const;

export type AdminListingSort = (typeof ADMIN_LISTING_SORTS)[number];
export type AdminListingSortDir = "asc" | "desc";

export type AdminListingFilters = {
  q?: string;
  status?: AppListingStatus;
  sellerType?: AppSellerType;
  sellerId?: string;
  category?: VehicleCategory;
  from?: string;
  to?: string;
  sort: AdminListingSort;
  dir: AdminListingSortDir;
  page: number;
};

export type AdminListingsHrefContext = {
  pathname?: string;
  extra?: Record<string, string | undefined>;
  omit?: Array<keyof AdminListingFilters>;
};

export type AdminListingRow = {
  id: string;
  vehicleNumber: number;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  images: string[];
  status: ListingStatus;
  mutedReason: string | null;
  featuredUntil: string | null;
  createdAt: string;
  views: number;
  enquiries: number;
  sellerType: SellerType;
  sellerName: string;
};

type SearchParamValue = string | string[] | undefined;

function first(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

function isSort(value: string | undefined): value is AdminListingSort {
  return ADMIN_LISTING_SORTS.includes(value as AdminListingSort);
}

function isStatus(value: string | undefined): value is AppListingStatus {
  return LISTING_STATUSES.includes(value as AppListingStatus);
}

function isSellerType(value: string | undefined): value is AppSellerType {
  return value === "dealer" || value === "private";
}

function isDir(value: string | undefined): value is AdminListingSortDir {
  return value === "asc" || value === "desc";
}

function isDateParam(value: string | undefined) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export function parseAdminListingSearchParams(
  searchParams: Record<string, SearchParamValue> = {},
): AdminListingFilters {
  const q = first(searchParams.q)?.trim() || undefined;
  const statusRaw = first(searchParams.status)?.trim();
  const sellerRaw = first(searchParams.sellerType)?.trim();
  const categoryRaw = first(searchParams.category)?.trim();
  const from = first(searchParams.from)?.trim();
  const to = first(searchParams.to)?.trim();
  const sortRaw = first(searchParams.sort)?.trim();
  const dirRaw = first(searchParams.dir)?.trim();
  const pageRaw = Number(first(searchParams.page) ?? "1");

  return {
    q,
    status: isStatus(statusRaw) ? statusRaw : undefined,
    sellerType: isSellerType(sellerRaw) ? sellerRaw : undefined,
    category: categoryRaw && isVehicleCategory(categoryRaw) ? categoryRaw : undefined,
    from: isDateParam(from) ? from : undefined,
    to: isDateParam(to) ? to : undefined,
    sort: isSort(sortRaw) ? sortRaw : "createdAt",
    dir: isDir(dirRaw) ? dirRaw : "desc",
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1,
  };
}

export function adminListingsHref(
  filters: Partial<AdminListingFilters> & Pick<AdminListingFilters, "sort" | "dir" | "page">,
  context: AdminListingsHrefContext = {},
) {
  const params = new URLSearchParams();
  const omit = new Set(context.omit ?? []);
  if (filters.q && !omit.has("q")) params.set("q", filters.q);
  if (filters.status && !omit.has("status")) params.set("status", filters.status);
  if (filters.sellerType && !omit.has("sellerType")) params.set("sellerType", filters.sellerType);
  if (filters.sellerId && !omit.has("sellerId")) params.set("sellerId", filters.sellerId);
  if (filters.category && !omit.has("category")) params.set("category", filters.category);
  if (filters.from && !omit.has("from")) params.set("from", filters.from);
  if (filters.to && !omit.has("to")) params.set("to", filters.to);
  if (filters.sort !== "createdAt") params.set("sort", filters.sort);
  if (filters.dir !== "desc") params.set("dir", filters.dir);
  if (filters.page > 1) params.set("page", String(filters.page));
  for (const [key, value] of Object.entries(context.extra ?? {})) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  const pathname = context.pathname ?? "/admin/listings";
  return query ? `${pathname}?${query}` : pathname;
}

function endOfDay(date: string) {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + 1);
  return next;
}

function listingWhere(filters: AdminListingFilters): Prisma.ListingWhereInput {
  const clauses: Prisma.ListingWhereInput[] = [{ deletedAt: null }];

  if (filters.status) clauses.push({ status: filters.status });
  if (filters.sellerType) clauses.push({ sellerType: filters.sellerType });
  if (filters.sellerId) clauses.push({ sellerId: filters.sellerId });

  if (filters.category) {
    const bodies = bodyTypesForCategory(filters.category)
      .map((item) => item.value)
      .filter(isDbBodyType);
    if (bodies.length === 0) {
      clauses.push({ id: { in: [] } });
    } else if (bodies.length === 1) {
      clauses.push({ bodyType: bodies[0] });
    } else {
      clauses.push({ bodyType: { in: bodies } });
    }
  }

  if (filters.from) {
    clauses.push({ createdAt: { gte: new Date(`${filters.from}T00:00:00`) } });
  }
  if (filters.to) {
    clauses.push({ createdAt: { lt: endOfDay(filters.to) } });
  }

  const search = filters.q?.replace(/[%_,]/g, " ").trim();
  if (search) {
    clauses.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { seller: { name: { contains: search, mode: "insensitive" } } },
        { seller: { dealer: { name: { contains: search, mode: "insensitive" } } } },
      ],
    });
  }

  return { AND: clauses };
}

function listingOrderBy(
  filters: AdminListingFilters,
): Prisma.ListingOrderByWithRelationInput | Prisma.ListingOrderByWithRelationInput[] {
  const dir = filters.dir;
  switch (filters.sort) {
    case "title":
      return { title: dir };
    case "make":
      return [{ make: dir }, { model: dir }];
    case "price":
      return { price: dir };
    case "seller":
      return { seller: { name: dir } };
    case "status":
      return { status: dir };
    case "views":
      return { viewHistory: { _count: dir } };
    case "enquiries":
      return { enquiries: { _count: dir } };
    default:
      return { createdAt: dir };
  }
}

export async function getAdminListings(filters: AdminListingFilters) {
  if (filters.category) {
    const bodies = bodyTypesForCategory(filters.category)
      .map((item) => item.value)
      .filter(isDbBodyType);
    if (bodies.length === 0) {
      return { listings: [], total: 0, pageCount: 1, page: 1 };
    }
  }

  const where = listingWhere(filters);
  const skip = (filters.page - 1) * ADMIN_LISTINGS_PAGE_SIZE;

  const [rows, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: listingOrderBy(filters),
      skip,
      take: ADMIN_LISTINGS_PAGE_SIZE,
      select: {
        id: true,
        vehicleNumber: true,
        title: true,
        make: true,
        model: true,
        year: true,
        price: true,
        images: true,
        status: true,
        mutedReason: true,
        featuredUntil: true,
        createdAt: true,
        sellerType: true,
        seller: {
          select: {
            name: true,
            dealer: { select: { name: true } },
          },
        },
        _count: { select: { viewHistory: true, enquiries: true } },
      },
    }),
    prisma.listing.count({ where }),
  ]);

  const listings: AdminListingRow[] = rows.map((row) => ({
    id: row.id,
    vehicleNumber: row.vehicleNumber,
    title: row.title,
    make: row.make,
    model: row.model,
    year: row.year,
    price: row.price,
    images: row.images,
    status: row.status,
    mutedReason: row.mutedReason,
    featuredUntil: row.featuredUntil?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    views: row._count.viewHistory,
    enquiries: row._count.enquiries,
    sellerType: row.sellerType,
    sellerName:
      row.sellerType === "dealer"
        ? (row.seller.dealer?.name || row.seller.name)
        : row.seller.name,
  }));

  const pageCount = Math.max(1, Math.ceil(total / ADMIN_LISTINGS_PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);

  return { listings, total, pageCount, page };
}
