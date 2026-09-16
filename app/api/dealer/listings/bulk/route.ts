import { NextResponse } from "next/server";
import { requireDealerUser } from "@/lib/dealer";
import { jsonError } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { dealerListingBulkSchema } from "@/lib/validations/dealer";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { user, response } = await requireDealerUser();
  if (!user) return response;

  const parsed = dealerListingBulkSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Select at least one listing.");

  const owned = await prisma.listing.findMany({
    where: {
      id: { in: parsed.data.ids },
      sellerId: user.id,
      sellerType: "dealer",
    },
    select: { id: true },
  });
  const ids = owned.map((row) => row.id);
  if (ids.length === 0) return jsonError("Listing not found.", 404);

  if (parsed.data.action === "delete") {
    await prisma.listing.deleteMany({ where: { id: { in: ids } } });
  } else {
    await prisma.listing.updateMany({
      where: { id: { in: ids } },
      data: { status: "sold" },
    });
  }

  return NextResponse.json({ ids, action: parsed.data.action });
}
