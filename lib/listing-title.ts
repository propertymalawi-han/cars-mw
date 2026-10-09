import { variantFromTitle } from "@/lib/make-picker";

export function buildListingTitle({
  year,
  make,
  model,
  variant,
}: {
  year?: unknown;
  make?: unknown;
  model?: unknown;
  variant?: unknown;
}): string {
  return [year, make, model, variant].map(toTitlePart).filter(Boolean).join(" ");
}

function toTitlePart(part: unknown): string {
  if (part == null || typeof part === "object") return "";
  if (typeof part === "number" && Number.isNaN(part)) return "";
  return String(part).trim();
}

export function listingDisplayParts(listing: {
  title: string;
  make: string;
  model: string;
  year: number;
}) {
  return {
    headline: buildListingTitle(listing),
    subtitle: variantFromTitle(listing.title, listing.make, listing.model),
  };
}
