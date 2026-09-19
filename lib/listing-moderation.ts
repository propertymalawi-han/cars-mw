import { jsonError } from "@/lib/api-session";

export function listingOwnerMutationError(listing: {
  status: string;
  deletedAt: Date | null;
}) {
  if (listing.deletedAt) return jsonError("Listing not found.", 404);
  if (listing.status === "muted") {
    return jsonError("This listing is muted by CarsMW staff.", 403);
  }
  return null;
}
