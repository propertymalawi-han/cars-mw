import { NextResponse } from "next/server";
import { requireApiUser, jsonError } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validations/account";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const parsed = reviewSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Choose a rating and try again.");

  const dealer = await prisma.dealer.findUnique({
    where: { id: parsed.data.dealerId },
    select: { id: true },
  });
  if (!dealer) return jsonError("Dealer not found.", 404);

  const completed = await prisma.enquiry.findFirst({
    where: { userId: user.id, dealerId: dealer.id, status: "closed" },
    select: { id: true },
  });
  if (!completed) {
    return jsonError("Finish an enquiry with this dealer before leaving a review.");
  }

  try {
    const review = await prisma.review.create({
      data: {
        userId: user.id,
        dealerId: dealer.id,
        rating: parsed.data.rating,
        comment: parsed.data.comment ?? "",
      },
    });
    return NextResponse.json({ id: review.id });
  } catch {
    return jsonError("You have already reviewed this dealer.", 409);
  }
}
