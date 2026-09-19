import type { ListingStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  bodyTypesForCategory,
  isDbBodyType,
  isVehicleCategory,
  type VehicleCategory,
} from "@/lib/vehicle-search";
import { LISTING_STATUSES, type ListingStatus as AppListingStatus } from "@/types";

export const ANALYTICS_INTERVALS = ["day", "week", "month"] as const;
export type AnalyticsInterval = (typeof ANALYTICS_INTERVALS)[number];

export type AdminAnalyticsFilters = {
  from: string;
  to: string;
  interval: AnalyticsInterval;
  category?: VehicleCategory;
};

export type AnalyticsCountPoint = {
  date: string;
  count: number;
};

export type AnalyticsNamedCount = {
  name: string;
  count: number;
};

export type AnalyticsStatusCount = {
  status: AppListingStatus;
  count: number;
};

export type AnalyticsUserGrowthPoint = {
  date: string;
  individual: number;
  dealer: number;
};

export type AnalyticsEnquiryPoint = {
  date: string;
  enquiries: number;
  listings: number;
  listingsWithEnquiry: number;
  conversionRate: number;
};

export type AnalyticsTimeToSalePoint = {
  date: string;
  avgDays: number | null;
  soldCount: number;
};

export type AdminAnalyticsData = {
  filters: AdminAnalyticsFilters;
  listingsCreated: AnalyticsCountPoint[];
  listingsByStatus: AnalyticsStatusCount[];
  topMakes: AnalyticsNamedCount[];
  topDistricts: AnalyticsNamedCount[];
  userGrowth: AnalyticsUserGrowthPoint[];
  enquiries: AnalyticsEnquiryPoint[];
  timeToSale: {
    averageDays: number | null;
    soldCount: number;
    trend: AnalyticsTimeToSalePoint[];
  };
  totals: {
    listingsCreated: number;
    usersCreated: number;
    enquiries: number;
    conversionRate: number | null;
  };
};

const DATE_PARAM = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 86_400_000;

type SearchParamValue = string | string[] | undefined;

function first(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

function isInterval(value: string | undefined): value is AnalyticsInterval {
  return ANALYTICS_INTERVALS.includes(value as AnalyticsInterval);
}

function isDateParam(value: string | undefined) {
  return Boolean(value && DATE_PARAM.test(value));
}

function startOfDayUtc(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function utcDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function defaultAnalyticsRange(now = new Date()) {
  const to = startOfDayUtc(now);
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - 89);
  return { from: utcDateKey(from), to: utcDateKey(to) };
}

function parseUtcDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function exclusiveEnd(to: string) {
  const date = parseUtcDate(to);
  date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

function startOfWeekMondayUtc(date: Date) {
  const day = startOfDayUtc(date);
  const weekday = day.getUTCDay();
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
  day.setUTCDate(day.getUTCDate() - daysFromMonday);
  return day;
}

function startOfMonthUtc(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function bucketStart(date: Date, interval: AnalyticsInterval) {
  if (interval === "month") return startOfMonthUtc(date);
  if (interval === "week") return startOfWeekMondayUtc(date);
  return startOfDayUtc(date);
}

function nextBucket(date: Date, interval: AnalyticsInterval) {
  const next = new Date(date);
  if (interval === "month") {
    next.setUTCMonth(next.getUTCMonth() + 1);
    return next;
  }
  if (interval === "week") {
    next.setUTCDate(next.getUTCDate() + 7);
    return next;
  }
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

function bucketKeys(from: Date, toExclusive: Date, interval: AnalyticsInterval) {
  const keys: string[] = [];
  let cursor = bucketStart(from, interval);
  while (cursor < toExclusive) {
    keys.push(utcDateKey(cursor));
    cursor = nextBucket(cursor, interval);
  }
  return keys;
}

function emptyStatusCounts(): Record<ListingStatus, number> {
  return { active: 0, sold: 0, draft: 0, expired: 0, muted: 0 };
}

function categoryBodySet(category?: VehicleCategory) {
  if (!category) return null;
  return new Set(
    bodyTypesForCategory(category)
      .map((item) => item.value)
      .filter(isDbBodyType),
  );
}

export function parseAdminAnalyticsSearchParams(
  searchParams: Record<string, SearchParamValue> = {},
): AdminAnalyticsFilters {
  const defaults = defaultAnalyticsRange();
  const fromRaw = first(searchParams.from)?.trim();
  const toRaw = first(searchParams.to)?.trim();
  const intervalRaw = first(searchParams.interval)?.trim();
  const categoryRaw = first(searchParams.category)?.trim();

  let from = isDateParam(fromRaw) ? fromRaw! : defaults.from;
  let to = isDateParam(toRaw) ? toRaw! : defaults.to;
  if (from > to) {
    const swap = from;
    from = to;
    to = swap;
  }

  return {
    from,
    to,
    interval: isInterval(intervalRaw) ? intervalRaw : "day",
    category: categoryRaw && isVehicleCategory(categoryRaw) ? categoryRaw : undefined,
  };
}

export function adminAnalyticsHref(filters: Partial<AdminAnalyticsFilters>) {
  const defaults = defaultAnalyticsRange();
  const next: AdminAnalyticsFilters = {
    from: filters.from ?? defaults.from,
    to: filters.to ?? defaults.to,
    interval: filters.interval ?? "day",
    category: filters.category,
  };
  const params = new URLSearchParams();
  if (next.from !== defaults.from) params.set("from", next.from);
  if (next.to !== defaults.to) params.set("to", next.to);
  if (next.interval !== "day") params.set("interval", next.interval);
  if (next.category) params.set("category", next.category);
  const query = params.toString();
  return query ? `/admin/analytics?${query}` : "/admin/analytics";
}

export function formatAnalyticsBucket(date: string, interval: AnalyticsInterval) {
  const value = new Date(`${date}T00:00:00.000Z`);
  if (interval === "month") {
    return value.toLocaleDateString("en-GB", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }
  if (interval === "week") {
    return `W/c ${value.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    })}`;
  }
  return value.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function daysBetween(start: Date, end: Date) {
  return (end.getTime() - start.getTime()) / MS_PER_DAY;
}

export async function getAdminAnalytics(
  filters: AdminAnalyticsFilters,
): Promise<AdminAnalyticsData> {
  const from = parseUtcDate(filters.from);
  const toExclusive = exclusiveEnd(filters.to);
  const createdRange = { gte: from, lt: toExclusive };
  const keys = bucketKeys(from, toExclusive, filters.interval);
  const allowedBodies = categoryBodySet(filters.category);

  const listingBase: Prisma.ListingWhereInput = {
    deletedAt: null,
    createdAt: createdRange,
  };

  const [
    listingCreatedRows,
    statusGroups,
    makeGroups,
    districtGroups,
    userRows,
    enquiryRows,
    soldRows,
    listingsWithEnquiryRows,
  ] = await Promise.all([
    prisma.listing.findMany({
      where: listingBase,
      select: { createdAt: true, bodyType: true },
    }),
    prisma.listing.groupBy({
      by: ["status"],
      where: listingBase,
      _count: { _all: true },
    }),
    prisma.listing.groupBy({
      by: ["make"],
      where: listingBase,
      _count: { _all: true },
      orderBy: { _count: { make: "desc" } },
      take: 10,
    }),
    prisma.listing.groupBy({
      by: ["district"],
      where: listingBase,
      _count: { _all: true },
      orderBy: { _count: { district: "desc" } },
      take: 10,
    }),
    prisma.user.findMany({
      where: { createdAt: createdRange },
      select: { createdAt: true, accountType: true },
    }),
    prisma.enquiry.findMany({
      where: { createdAt: createdRange },
      select: { createdAt: true },
    }),
    prisma.listing.findMany({
      where: {
        deletedAt: null,
        soldAt: createdRange,
        OR: [{ status: "sold" }, { status: "muted", mutedPreviousStatus: "sold" }],
      },
      select: { createdAt: true, soldAt: true },
    }),
    prisma.listing.findMany({
      where: {
        ...listingBase,
        enquiries: { some: {} },
      },
      select: { createdAt: true },
    }),
  ]);

  const categoryListings =
    allowedBodies === null
      ? listingCreatedRows
      : allowedBodies.size === 0
        ? []
        : listingCreatedRows.filter((row) => allowedBodies.has(row.bodyType));

  const listingsCreatedMap = new Map(keys.map((key) => [key, 0]));
  for (const row of categoryListings) {
    const key = utcDateKey(bucketStart(row.createdAt, filters.interval));
    if (listingsCreatedMap.has(key)) {
      listingsCreatedMap.set(key, (listingsCreatedMap.get(key) ?? 0) + 1);
    }
  }

  const byStatus = emptyStatusCounts();
  for (const row of statusGroups) {
    byStatus[row.status] = row._count._all;
  }

  const userMap = new Map(keys.map((key) => [key, { individual: 0, dealer: 0 }]));
  for (const row of userRows) {
    const key = utcDateKey(bucketStart(row.createdAt, filters.interval));
    const point = userMap.get(key);
    if (!point) continue;
    if (row.accountType === "dealer") point.dealer += 1;
    else point.individual += 1;
  }

  const enquiryCountMap = new Map(keys.map((key) => [key, 0]));
  for (const row of enquiryRows) {
    const key = utcDateKey(bucketStart(row.createdAt, filters.interval));
    if (enquiryCountMap.has(key)) {
      enquiryCountMap.set(key, (enquiryCountMap.get(key) ?? 0) + 1);
    }
  }

  const listingCohortMap = new Map(keys.map((key) => [key, 0]));
  for (const row of listingCreatedRows) {
    const key = utcDateKey(bucketStart(row.createdAt, filters.interval));
    if (listingCohortMap.has(key)) {
      listingCohortMap.set(key, (listingCohortMap.get(key) ?? 0) + 1);
    }
  }

  const withEnquiryMap = new Map(keys.map((key) => [key, 0]));
  for (const row of listingsWithEnquiryRows) {
    const key = utcDateKey(bucketStart(row.createdAt, filters.interval));
    if (withEnquiryMap.has(key)) {
      withEnquiryMap.set(key, (withEnquiryMap.get(key) ?? 0) + 1);
    }
  }

  const timeToSaleMap = new Map(
    keys.map((key) => [key, { totalDays: 0, soldCount: 0 }]),
  );
  let soldDaysTotal = 0;
  for (const row of soldRows) {
    if (!row.soldAt) continue;
    const days = daysBetween(row.createdAt, row.soldAt);
    soldDaysTotal += days;
    const key = utcDateKey(bucketStart(row.soldAt, filters.interval));
    const point = timeToSaleMap.get(key);
    if (!point) continue;
    point.totalDays += days;
    point.soldCount += 1;
  }

  const listingsCreatedTotal = categoryListings.length;
  const allListingsCreatedTotal = listingCreatedRows.length;
  const conversionRate =
    allListingsCreatedTotal === 0
      ? null
      : listingsWithEnquiryRows.length / allListingsCreatedTotal;

  return {
    filters,
    listingsCreated: keys.map((date) => ({
      date,
      count: listingsCreatedMap.get(date) ?? 0,
    })),
    listingsByStatus: LISTING_STATUSES.map((status) => ({
      status,
      count: byStatus[status],
    })),
    topMakes: makeGroups.map((row) => ({
      name: row.make,
      count: row._count._all,
    })),
    topDistricts: districtGroups.map((row) => ({
      name: row.district,
      count: row._count._all,
    })),
    userGrowth: keys.map((date) => {
      const point = userMap.get(date) ?? { individual: 0, dealer: 0 };
      return { date, individual: point.individual, dealer: point.dealer };
    }),
    enquiries: keys.map((date) => {
      const listings = listingCohortMap.get(date) ?? 0;
      const listingsWithEnquiry = withEnquiryMap.get(date) ?? 0;
      return {
        date,
        enquiries: enquiryCountMap.get(date) ?? 0,
        listings,
        listingsWithEnquiry,
        conversionRate: listings === 0 ? 0 : listingsWithEnquiry / listings,
      };
    }),
    timeToSale: {
      averageDays: soldRows.length === 0 ? null : soldDaysTotal / soldRows.length,
      soldCount: soldRows.length,
      trend: keys.map((date) => {
        const point = timeToSaleMap.get(date) ?? { totalDays: 0, soldCount: 0 };
        return {
          date,
          avgDays: point.soldCount === 0 ? null : point.totalDays / point.soldCount,
          soldCount: point.soldCount,
        };
      }),
    },
    totals: {
      listingsCreated: listingsCreatedTotal,
      usersCreated: userRows.length,
      enquiries: enquiryRows.length,
      conversionRate,
    },
  };
}
