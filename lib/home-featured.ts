import type { Dealer, Listing } from "@/types";

export const HOME_FEATURED_TAB_IDS = [
  "all",
  "sedan",
  "suv",
  "pickup",
  "hatchback",
  "van",
] as const;

export type HomeFeaturedTabId = (typeof HOME_FEATURED_TAB_IDS)[number];

export type FeaturedListingsResult = {
  listings: Listing[];
  dealers: Dealer[];
};

export type HomeFeaturedSections = Record<HomeFeaturedTabId, FeaturedListingsResult>;
