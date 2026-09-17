import type {
  Dealer as PrismaDealer,
  ListingStatus,
} from "@prisma/client";
import { expireStalePrivateListings } from "@/lib/listing-expiry";
import { prisma } from "@/lib/prisma";
import { dealerFromSeller, mapPrismaListing } from "@/lib/prisma-mappers";
import {
  NOTIFICATION_PREFERENCES,
  type NotificationKey,
} from "@/lib/notification-preferences";
import { getSupabase } from "@/lib/supabase/server";
import type { Dealer, Listing } from "@/types";

const VIEW_HISTORY_LIMIT = 50;

export type AccountListingRow = {
  id: string;
  vehicleNumber: number;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  status: ListingStatus;
  images: string[];
  createdAt: string;
  views: number;
  enquiries: number;
};

export async function getAccountListings(sellerId: string): Promise<AccountListingRow[]> {
  if (!process.env.DATABASE_URL) {
    const { data, error } = await getSupabase()
      .from("listings")
      .select("id, vehicle_number, title, make, model, year, price, status, images, created_at")
      .eq("seller_id", sellerId)
      .eq("seller_type", "private")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load listings:", error.message);
      throw new Error(`Failed to load listings: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      vehicleNumber: row.vehicle_number,
      title: row.title,
      make: row.make,
      model: row.model,
      year: row.year,
      price: row.price,
      status: row.status,
      images: row.images ?? [],
      createdAt: row.created_at,
      views: 0,
      enquiries: 0,
    }));
  }

  await expireStalePrivateListings(sellerId);

  const rows = await prisma.listing.findMany({
    where: { sellerId, sellerType: "private" },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      vehicleNumber: true,
      title: true,
      make: true,
      model: true,
      year: true,
      price: true,
      status: true,
      images: true,
      createdAt: true,
      _count: { select: { viewHistory: true, enquiries: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    vehicleNumber: row.vehicleNumber,
    title: row.title,
    make: row.make,
    model: row.model,
    year: row.year,
    price: row.price,
    status: row.status,
    images: row.images,
    createdAt: row.createdAt.toISOString(),
    views: row._count.viewHistory,
    enquiries: row._count.enquiries,
  }));
}

export type ListingWithDealer = {
  listing: Listing;
  dealer?: Dealer;
};

type ListingWithSeller = Parameters<typeof mapPrismaListing>[0] & {
  seller: { dealer: PrismaDealer | null };
};

function withDealer(listing: ListingWithSeller): ListingWithDealer {
  return {
    listing: mapPrismaListing(listing),
    dealer: dealerFromSeller(listing.seller, listing.sellerType),
  };
}

const listingCardWithSeller = {
  select: {
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
    description: true,
    sellerId: true,
    sellerType: true,
    status: true,
    featuredUntil: true,
    createdAt: true,
    seller: { select: { dealer: true } },
  },
} as const;

export async function getFavouriteListings(userId: string): Promise<ListingWithDealer[]> {
  const rows = await prisma.favourite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { listing: listingCardWithSeller },
  });
  return rows.map((row) => withDealer(row.listing));
}

export async function getFavouriteListingIds(userId: string): Promise<Set<string>> {
  const rows = await prisma.favourite.findMany({
    where: { userId },
    select: { listingId: true },
  });
  return new Set(rows.map((row) => row.listingId));
}

export async function getViewHistory(userId: string): Promise<
  (ListingWithDealer & { viewedAt: string })[]
> {
  const rows = await prisma.viewHistory.findMany({
    where: { userId },
    orderBy: { viewedAt: "desc" },
    take: VIEW_HISTORY_LIMIT,
    include: { listing: listingCardWithSeller },
  });
  return rows.map((row) => ({
    ...withDealer(row.listing),
    viewedAt: row.viewedAt.toISOString(),
  }));
}

export async function recordListingView(userId: string, listingId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { sellerId: true },
  });
  if (!listing || listing.sellerId === userId) return;

  await prisma.viewHistory.upsert({
    where: { userId_listingId: { userId, listingId } },
    create: { userId, listingId },
    update: { viewedAt: new Date() },
  });

  const extra = await prisma.viewHistory.findMany({
    where: { userId },
    orderBy: { viewedAt: "desc" },
    skip: VIEW_HISTORY_LIMIT,
    select: { id: true },
  });
  if (extra.length > 0) {
    await prisma.viewHistory.deleteMany({
      where: { id: { in: extra.map((row) => row.id) } },
    });
  }
}

export async function getUserEnquiries(userId: string) {
  return prisma.enquiry.findMany({
    where: { userId },
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
      dealer: true,
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
      },
    },
  });
}

export async function getEnquiryForListing(userId: string, listingId: string) {
  return prisma.enquiry.findFirst({
    where: { userId, listingId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
}

export async function getUserReviews(userId: string) {
  return prisma.review.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { dealer: true },
  });
}

export async function getReviewableDealers(userId: string) {
  const closed = await prisma.enquiry.findMany({
    where: {
      userId,
      status: "closed",
      dealerId: { not: null },
    },
    distinct: ["dealerId"],
    orderBy: { createdAt: "desc" },
    include: { dealer: true },
  });

  const reviewed = await prisma.review.findMany({
    where: { userId },
    select: { dealerId: true },
  });
  const reviewedIds = new Set(reviewed.map((row) => row.dealerId));

  return closed
    .map((enquiry) => enquiry.dealer)
    .filter((dealer): dealer is NonNullable<typeof dealer> => Boolean(dealer))
    .filter((dealer) => !reviewedIds.has(dealer.id));
}

export async function getNotificationPreferences(userId: string) {
  const existing = await prisma.notificationPreference.findMany({
    where: { userId },
  });
  const byKey = new Map(existing.map((row) => [row.key, row]));

  const missing = NOTIFICATION_PREFERENCES.filter((item) => !byKey.has(item.key));
  if (missing.length > 0) {
    await prisma.notificationPreference.createMany({
      data: missing.map((item) => ({
        userId,
        key: item.key,
        ...item.defaults,
      })),
      skipDuplicates: true,
    });
  }

  const rows =
    missing.length > 0
      ? await prisma.notificationPreference.findMany({ where: { userId } })
      : existing;

  const latest = new Map(rows.map((row) => [row.key, row]));
  return NOTIFICATION_PREFERENCES.map((item) => {
    const row = latest.get(item.key);
    return {
      key: item.key as NotificationKey,
      emailEnabled: row?.emailEnabled ?? item.defaults.emailEnabled,
      smsEnabled: row?.smsEnabled ?? item.defaults.smsEnabled,
      whatsappEnabled: row?.whatsappEnabled ?? item.defaults.whatsappEnabled,
    };
  });
}
