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

export const LISTING_STATUS_LABEL: Record<string, string> = {
  active: "Active",
  sold: "Sold",
  draft: "Draft",
  expired: "Expired",
};
