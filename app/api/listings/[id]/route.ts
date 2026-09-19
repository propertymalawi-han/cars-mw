import { NextResponse } from "next/server";
import { jsonError, requireApiUser } from "@/lib/api-session";
import { listingOwnerMutationError } from "@/lib/listing-moderation";
import { listingWriteData } from "@/lib/listing-write";
import { prisma } from "@/lib/prisma";
import { listingSchema } from "@/lib/validations/listing";
import { revalidateListingsCache } from "@/lib/listings-cache";
import { isStaffRole } from "@/types";

export const runtime = "nodejs";

type RouteContext = { params: { id: string } };

export async function PATCH(request: Request, { params }: RouteContext) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const parsed = listingSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Check the highlighted fields and try again.",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const staff = isStaffRole(user.role);
  const listing = await prisma.listing.findFirst({
    where: staff
      ? { id: params.id, deletedAt: null }
      : { id: params.id, sellerId: user.id, deletedAt: null },
  });
  if (!listing) return jsonError("Listing not found.", 404);
  if (!staff) {
    const blocked = listingOwnerMutationError(listing);
    if (blocked) return blocked;
  }

  const updated = await prisma.listing.update({
    where: { id: listing.id },
    data: {
      ...listingWriteData(parsed.data),
      status: listing.status === "draft" ? "active" : listing.status,
    },
  });

  revalidateListingsCache();
  return NextResponse.json({ id: updated.id });
}
