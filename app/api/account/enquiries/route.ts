import { NextResponse } from "next/server";
import { requireApiUser, jsonError } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { enquirySchema } from "@/lib/validations/account";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const parsed = enquirySchema.safeParse(await request.json());
  if (!parsed.success) {
    return jsonError("Write a short message about the listing.");
  }

  const listing = await prisma.listing.findUnique({
    where: { id: parsed.data.listingId },
    include: { seller: { include: { dealer: true } } },
  });
  if (!listing || listing.deletedAt || listing.status === "muted" || listing.status === "draft") {
    return jsonError("Listing not found.", 404);
  }
  if (listing.sellerId === user.id) {
    return jsonError("You cannot enquire about your own listing.");
  }

  const existing = await prisma.enquiry.findFirst({
    where: { userId: user.id, listingId: listing.id, status: { not: "closed" } },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ id: existing.id, existing: true });
  }

  const dealerId = listing.seller.dealer?.id ?? null;
  const enquiry = await prisma.enquiry.create({
    data: {
      userId: user.id,
      listingId: listing.id,
      dealerId,
      message: parsed.data.message,
      messages: {
        create: {
          senderId: user.id,
          body: parsed.data.message,
        },
      },
    },
  });

  return NextResponse.json({ id: enquiry.id });
}
