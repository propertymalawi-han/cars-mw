import { NextResponse } from "next/server";
import { jsonError, requireApiUser } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const listingId = new URL(request.url).searchParams.get("listingId")?.trim();
  if (!listingId) return jsonError("Choose a listing.");

  const [favourite, enquiry] = await Promise.all([
    prisma.favourite.findUnique({
      where: { userId_listingId: { userId: user.id, listingId } },
      select: { id: true },
    }),
    prisma.enquiry.findFirst({
      where: { userId: user.id, listingId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    }),
  ]);

  return NextResponse.json({
    saved: Boolean(favourite),
    enquiryId: enquiry?.id ?? null,
  });
}
