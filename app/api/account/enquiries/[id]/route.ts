import { NextResponse } from "next/server";
import { requireApiUser, jsonError } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { enquiryStatusSchema } from "@/lib/validations/account";

export const runtime = "nodejs";

type RouteContext = { params: { id: string } };

async function getAccessibleEnquiry(userId: string, id: string) {
  return prisma.enquiry.findFirst({
    where: {
      id,
      OR: [{ userId }, { listing: { sellerId: userId } }],
    },
    include: { listing: { select: { sellerId: true } } },
  });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const parsed = enquiryStatusSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Choose a valid status.");

  const enquiry = await getAccessibleEnquiry(user.id, params.id);
  if (!enquiry) return jsonError("Enquiry not found.", 404);

  const updated = await prisma.enquiry.update({
    where: { id: enquiry.id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json({ id: updated.id, status: updated.status });
}
