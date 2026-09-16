import type { ListingStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { jsonError, requireApiUser } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function requireDealerPage(returnTo = "/dealer/dashboard") {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/sign-in?returnTo=${encodeURIComponent(returnTo)}`);
  }
  if (user.accountType !== "dealer") {
    redirect("/account");
  }
  const dealer = await prisma.dealer.findUnique({
    where: { userId: user.id },
  });
  return { user, dealer };
}

export async function requireDealerUser() {
  const { user, response } = await requireApiUser();
  if (!user) return { user: null, dealer: null, response };
  if (user.accountType !== "dealer") {
    return { user: null, dealer: null, response: jsonError("Dealer access only.", 403) };
  }
  const dealer = await prisma.dealer.findUnique({ where: { userId: user.id } });
  if (!dealer) {
    return {
      user: null,
      dealer: null,
      response: jsonError("Dealership profile is missing.", 404),
    };
  }
  return { user, dealer, response: null };
}

function startOfMonth(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function startOfDayUtc(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function daysAgo(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return startOfDayUtc(date);
}

export type DealerChartPoint = {
  date: string;
  views: number;
  enquiries: number;
};

export type DealerOverviewStats = {
  activeListings: number;
  viewsThisMonth: number;
  enquiriesThisMonth: number;
  verified: boolean;
  chart: DealerChartPoint[];
};

export async function getDealerOverviewStats(
  sellerId: string,
  dealerId: string,
): Promise<DealerOverviewStats> {
  const monthStart = startOfMonth();
  const from = daysAgo(29);
  const listingWhere = { sellerId, sellerType: "dealer" as const };

  const [activeListings, viewsThisMonth, enquiriesThisMonth, views, enquiries, dealer] =
    await Promise.all([
      prisma.listing.count({
        where: { ...listingWhere, status: "active" },
      }),
      prisma.viewHistory.count({
        where: {
          viewedAt: { gte: monthStart },
          listing: listingWhere,
        },
      }),
      prisma.enquiry.count({
        where: {
          dealerId,
          createdAt: { gte: monthStart },
        },
      }),
      prisma.viewHistory.findMany({
        where: {
          viewedAt: { gte: from },
          listing: listingWhere,
        },
        select: { viewedAt: true },
      }),
      prisma.enquiry.findMany({
        where: {
          dealerId,
          createdAt: { gte: from },
        },
        select: { createdAt: true },
      }),
      prisma.dealer.findUnique({
        where: { id: dealerId },
        select: { verified: true },
      }),
    ]);

  const chartMap = new Map<string, DealerChartPoint>();
  for (let i = 0; i < 30; i += 1) {
    const day = new Date(from);
    day.setUTCDate(from.getUTCDate() + i);
    const key = day.toISOString().slice(0, 10);
    chartMap.set(key, { date: key, views: 0, enquiries: 0 });
  }

  for (const row of views) {
    const key = row.viewedAt.toISOString().slice(0, 10);
    const point = chartMap.get(key);
    if (point) point.views += 1;
  }
  for (const row of enquiries) {
    const key = row.createdAt.toISOString().slice(0, 10);
    const point = chartMap.get(key);
    if (point) point.enquiries += 1;
  }

  return {
    activeListings,
    viewsThisMonth,
    enquiriesThisMonth,
    verified: Boolean(dealer?.verified),
    chart: Array.from(chartMap.values()),
  };
}

export type DealerListingRow = {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  status: ListingStatus;
  images: string[];
  createdAt: string;
  featuredUntil: string | null;
  views: number;
  enquiries: number;
};

export async function getDealerListings(sellerId: string): Promise<DealerListingRow[]> {
  const rows = await prisma.listing.findMany({
    where: { sellerId, sellerType: "dealer" },
    orderBy: [{ createdAt: "desc" }],
    include: {
      _count: { select: { viewHistory: true, enquiries: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    make: row.make,
    model: row.model,
    year: row.year,
    price: row.price,
    status: row.status,
    images: row.images,
    createdAt: row.createdAt.toISOString(),
    featuredUntil: row.featuredUntil?.toISOString() ?? null,
    views: row._count.viewHistory,
    enquiries: row._count.enquiries,
  }));
}

export async function getDealerEnquiries(dealerId: string) {
  return prisma.enquiry.findMany({
    where: { dealerId },
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          make: true,
          model: true,
          year: true,
          images: true,
        },
      },
      user: { select: { id: true, name: true, avatarUrl: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
      },
    },
  });
}
