import type { AccountType, ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatVehicleId } from "@/lib/vehicle-id";

export type AdminChartPoint = {
  date: string;
  count: number;
};

export type AdminActivityItem = {
  id: string;
  kind: "listing" | "signup";
  createdAt: string;
  title: string;
  href?: string;
  detail: string;
};

export type AdminOverviewStats = {
  listings: {
    total: number;
    byStatus: Record<ListingStatus, number>;
  };
  users: {
    total: number;
    byAccountType: Record<AccountType, number>;
    signupsThisWeek: number;
    signupsThisMonth: number;
  };
  enquiries: {
    thisWeek: number;
    thisMonth: number;
  };
  pendingDealerVerifications: number;
  listingsPerDay: AdminChartPoint[];
  signupsPerDay: AdminChartPoint[];
  recentActivity: AdminActivityItem[];
};

function startOfDayUtc(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function startOfMonthUtc(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function startOfWeekMondayUtc(date = new Date()) {
  const day = startOfDayUtc(date);
  const weekday = day.getUTCDay();
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
  day.setUTCDate(day.getUTCDate() - daysFromMonday);
  return day;
}

function daysAgoUtc(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return startOfDayUtc(date);
}

function emptyStatusCounts(): Record<ListingStatus, number> {
  return { active: 0, sold: 0, draft: 0, expired: 0, muted: 0 };
}

function emptyAccountCounts(): Record<AccountType, number> {
  return { individual: 0, dealer: 0 };
}

function seriesFromRows(
  from: Date,
  rows: Array<{ createdAt: Date }>,
): AdminChartPoint[] {
  const chartMap = new Map<string, AdminChartPoint>();
  for (let i = 0; i < 30; i += 1) {
    const day = new Date(from);
    day.setUTCDate(from.getUTCDate() + i);
    const key = day.toISOString().slice(0, 10);
    chartMap.set(key, { date: key, count: 0 });
  }

  for (const row of rows) {
    const key = row.createdAt.toISOString().slice(0, 10);
    const point = chartMap.get(key);
    if (point) point.count += 1;
  }

  return Array.from(chartMap.values());
}

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const monthStart = startOfMonthUtc();
  const weekStart = startOfWeekMondayUtc();
  const from = daysAgoUtc(29);

  const [
    listingGroups,
    userGroups,
    pendingDealerVerifications,
    recentListings,
    recentUsers,
  ] = await Promise.all([
    prisma.listing.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.user.groupBy({
      by: ["accountType"],
      _count: { _all: true },
    }),
    prisma.dealer.count({ where: { verified: false } }),
    prisma.listing.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        vehicleNumber: true,
        make: true,
        model: true,
        year: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        accountType: true,
        createdAt: true,
      },
    }),
  ]);

  const [
    signupsThisWeek,
    signupsThisMonth,
    enquiriesThisWeek,
    enquiriesThisMonth,
  ] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.enquiry.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.enquiry.count({ where: { createdAt: { gte: monthStart } } }),
  ]);

  const [listingCreated, userCreated] = await Promise.all([
    prisma.listing.findMany({
      where: { createdAt: { gte: from } },
      select: { createdAt: true },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: from } },
      select: { createdAt: true },
    }),
  ]);

  const byStatus = emptyStatusCounts();
  for (const row of listingGroups) {
    byStatus[row.status] = row._count._all;
  }

  const byAccountType = emptyAccountCounts();
  for (const row of userGroups) {
    byAccountType[row.accountType] = row._count._all;
  }

  const listingActivity: AdminActivityItem[] = recentListings.map((listing) => ({
    id: `listing-${listing.id}`,
    kind: "listing",
    createdAt: listing.createdAt.toISOString(),
    title: listing.title,
    href: `/listings/${listing.id}`,
    detail: `${formatVehicleId(listing.vehicleNumber)} · ${listing.year} ${listing.make} ${listing.model} · ${listing.status}`,
  }));

  const signupActivity: AdminActivityItem[] = recentUsers.map((user) => ({
    id: `signup-${user.id}`,
    kind: "signup",
    createdAt: user.createdAt.toISOString(),
    title: user.name,
    href: "/admin/users",
    detail: `${user.email} · ${user.accountType}`,
  }));

  const recentActivity = [...listingActivity, ...signupActivity].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );

  return {
    listings: {
      total: Object.values(byStatus).reduce((sum, count) => sum + count, 0),
      byStatus,
    },
    users: {
      total: Object.values(byAccountType).reduce((sum, count) => sum + count, 0),
      byAccountType,
      signupsThisWeek,
      signupsThisMonth,
    },
    enquiries: {
      thisWeek: enquiriesThisWeek,
      thisMonth: enquiriesThisMonth,
    },
    pendingDealerVerifications,
    listingsPerDay: seriesFromRows(from, listingCreated),
    signupsPerDay: seriesFromRows(from, userCreated),
    recentActivity,
  };
}
