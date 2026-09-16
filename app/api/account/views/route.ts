import { NextResponse } from "next/server";
import { recordListingView } from "@/lib/account";
import { requireApiUser, jsonError } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { viewHistorySchema } from "@/lib/validations/account";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const parsed = viewHistorySchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Choose a listing to record.");

  const listing = await prisma.listing.findUnique({
    where: { id: parsed.data.listingId },
    select: { id: true },
  });
  if (!listing) return jsonError("Listing not found.", 404);

  await recordListingView(user.id, listing.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  await prisma.viewHistory.deleteMany({ where: { userId: user.id } });
  return NextResponse.json({ ok: true });
}
