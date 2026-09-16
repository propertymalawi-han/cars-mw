import { NextResponse } from "next/server";
import { requireDealerUser } from "@/lib/dealer";
import { jsonError } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = { params: { id: string } };

export async function POST(_request: Request, { params }: RouteContext) {
  const { user, response } = await requireDealerUser();
  if (!user) return response;

  const listing = await prisma.listing.findFirst({
    where: { id: params.id, sellerId: user.id, sellerType: "dealer" },
  });
  if (!listing) return jsonError("Listing not found.", 404);

  const copy = await prisma.listing.create({
    data: {
      title: listing.title,
      make: listing.make,
      model: listing.model,
      year: listing.year,
      price: listing.price,
      mileage: listing.mileage,
      transmission: listing.transmission,
      fuelType: listing.fuelType,
      bodyType: listing.bodyType,
      district: listing.district,
      city: listing.city,
      images: listing.images,
      description: listing.description,
      sellerId: user.id,
      sellerType: "dealer",
      status: "draft",
    },
  });

  return NextResponse.json({ id: copy.id });
}
