import type { ListingStatus } from "@/types";

export const FEATURE_PERIOD_DAYS = [7, 14, 30] as const;
export const DEFAULT_FEATURE_DAYS = 14;

export type FeaturePeriodDays = (typeof FEATURE_PERIOD_DAYS)[number];

export function isListingFeatured(featuredUntil?: string | Date | null) {
  if (!featuredUntil) return false;
  return new Date(featuredUntil).getTime() > Date.now();
}

export function featuredUntilFromDays(days: number) {
  const until = new Date();
  until.setUTCDate(until.getUTCDate() + days);
  return until;
}

export const LISTING_STATUS_LABEL: Record<ListingStatus, string> = {
  active: "Active",
  sold: "Sold",
  draft: "Draft",
  expired: "Expired",
  muted: "Muted",
};

export const LISTING_STATUS_VARIANT: Record<
  ListingStatus,
  "success" | "copper" | "secondary" | "outline" | "destructive"
> = {
  active: "success",
  sold: "copper",
  draft: "secondary",
  expired: "outline",
  muted: "destructive",
};
