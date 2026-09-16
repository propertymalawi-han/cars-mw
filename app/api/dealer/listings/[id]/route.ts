import { NextResponse } from "next/server";
import { requireDealerUser } from "@/lib/dealer";
import { jsonError } from "@/lib/api-session";
import { featuredUntilFromDays } from "@/lib/listing-featured";
import { prisma } from "@/lib/prisma";
import { dealerListingPatchSchema } from "@/lib/validations/dealer";

export const runtime = "nodejs";

type RouteContext = { params: { id: string } };

async function getOwnedListing(sellerId: string, id: string) {
  return prisma.listing.findFirst({
    where: { id, sellerId, sellerType: "dealer" },
  });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { user, response } = await requireDealerUser();
  if (!user) return response;

  const parsed = dealerListingPatchSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Could not update that listing.");

  const listing = await getOwnedListing(user.id, params.id);
  if (!listing) return jsonError("Listing not found.", 404);

  const data: {
    status?: typeof listing.status;
    featuredUntil?: Date | null;
  } = {};

  if (parsed.data.status) data.status = parsed.data.status;
  if (parsed.data.featured === false) data.featuredUntil = null;
  if (parsed.data.featured === true) {
    data.featuredUntil = featuredUntilFromDays(parsed.data.days ?? 14);
  }

  const updated = await prisma.listing.update({
    where: { id: listing.id },
    data,
  });

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    featuredUntil: updated.featuredUntil,
  });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { user, response } = await requireDealerUser();
  if (!user) return response;

  const listing = await getOwnedListing(user.id, params.id);
  if (!listing) return jsonError("Listing not found.", 404);

  await prisma.listing.delete({ where: { id: listing.id } });
  return NextResponse.json({ id: listing.id });
}
