import { NextResponse } from "next/server";
import { requireApiUser, jsonError } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { favouriteSchema } from "@/lib/validations/account";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const parsed = favouriteSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Choose a listing to save.");

  const listing = await prisma.listing.findUnique({
    where: { id: parsed.data.listingId },
    select: { id: true },
  });
  if (!listing) return jsonError("Listing not found.", 404);

  const existing = await prisma.favourite.findUnique({
    where: {
      userId_listingId: { userId: user.id, listingId: listing.id },
    },
  });

  if (existing) {
    await prisma.favourite.delete({ where: { id: existing.id } });
    return NextResponse.json({ saved: false });
  }

  await prisma.favourite.create({
    data: { userId: user.id, listingId: listing.id },
  });
  return NextResponse.json({ saved: true });
}
