import { NextResponse } from "next/server";
import { requireApiUser, jsonError } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { reviewUpdateSchema } from "@/lib/validations/account";

export const runtime = "nodejs";

type RouteContext = { params: { id: string } };

export async function PATCH(request: Request, { params }: RouteContext) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const parsed = reviewUpdateSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Choose a rating and try again.");

  const review = await prisma.review.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!review) return jsonError("Review not found.", 404);

  const updated = await prisma.review.update({
    where: { id: review.id },
    data: {
      rating: parsed.data.rating,
      comment: parsed.data.comment ?? "",
    },
  });

  return NextResponse.json({ id: updated.id });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const review = await prisma.review.findFirst({
    where: { id: params.id, userId: user.id },
    select: { id: true },
  });
  if (!review) return jsonError("Review not found.", 404);

  await prisma.review.delete({ where: { id: review.id } });
  return NextResponse.json({ ok: true });
}
