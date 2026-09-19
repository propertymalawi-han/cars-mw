import { NextResponse } from "next/server";
import { jsonError, requireApiUser } from "@/lib/api-session";
import { expireStalePrivateListings, privateListingRenewData } from "@/lib/listing-expiry";
import { listingOwnerMutationError } from "@/lib/listing-moderation";
import { listingSoldWrite } from "@/lib/listing-sold";
import { prisma } from "@/lib/prisma";
import { accountListingPatchSchema } from "@/lib/validations/account";
import { revalidateListingsCache } from "@/lib/listings-cache";

export const runtime = "nodejs";

type RouteContext = { params: { id: string } };

async function getOwnedListing(sellerId: string, id: string) {
  await expireStalePrivateListings(sellerId);
  return prisma.listing.findFirst({
    where: { id, sellerId, sellerType: "private", deletedAt: null },
  });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { user, response } = await requireApiUser();
  if (!user) return response;
  if (user.accountType === "dealer") {
    return jsonError("Use the dealer dashboard to manage dealership listings.", 403);
  }

  const parsed = accountListingPatchSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Could not update that listing.");

  const listing = await getOwnedListing(user.id, params.id);
  if (!listing) return jsonError("Listing not found.", 404);
  const blocked = listingOwnerMutationError(listing);
  if (blocked) return blocked;

  if (parsed.data.renew) {
    if (listing.status !== "expired") {
      return jsonError("Only expired listings can be renewed.");
    }
    const updated = await prisma.listing.update({
      where: { id: listing.id },
      data: privateListingRenewData(),
    });
    revalidateListingsCache();
    return NextResponse.json({ id: updated.id, status: updated.status });
  }

  const updated = await prisma.listing.update({
    where: { id: listing.id },
    data: listingSoldWrite(listing.status, listing.soldAt),
  });
  revalidateListingsCache();
  return NextResponse.json({ id: updated.id, status: updated.status });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { user, response } = await requireApiUser();
  if (!user) return response;
  if (user.accountType === "dealer") {
    return jsonError("Use the dealer dashboard to manage dealership listings.", 403);
  }

  const listing = await getOwnedListing(user.id, params.id);
  if (!listing) return jsonError("Listing not found.", 404);
  const blockedDelete = listingOwnerMutationError(listing);
  if (blockedDelete) return blockedDelete;

  await prisma.listing.delete({ where: { id: listing.id } });
  revalidateListingsCache();
  return NextResponse.json({ id: listing.id });
}
