import { NextResponse } from "next/server";
import { jsonError, requireApiUser } from "@/lib/api-session";
import { listingWriteData } from "@/lib/listing-write";
import { prisma } from "@/lib/prisma";
import { listingSchema } from "@/lib/validations/listing";

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

  const listing = await prisma.listing.findFirst({
    where: { id: params.id, sellerId: user.id },
  });
  if (!listing) return jsonError("Listing not found.", 404);

  const updated = await prisma.listing.update({
    where: { id: listing.id },
    data: {
      ...listingWriteData(parsed.data),
      status: listing.status === "draft" ? "active" : listing.status,
    },
  });

  return NextResponse.json({ id: updated.id });
}
