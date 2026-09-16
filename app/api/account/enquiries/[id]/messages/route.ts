import { NextResponse } from "next/server";
import { requireApiUser, jsonError } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { enquiryMessageSchema } from "@/lib/validations/account";

export const runtime = "nodejs";

type RouteContext = { params: { id: string } };

export async function POST(request: Request, { params }: RouteContext) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const parsed = enquiryMessageSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Write a message.");

  const enquiry = await prisma.enquiry.findUnique({
    where: { id: params.id },
    include: { listing: { select: { sellerId: true } } },
  });
  if (!enquiry) return jsonError("Enquiry not found.", 404);

  const isBuyer = enquiry.userId === user.id;
  const isSeller = enquiry.listing.sellerId === user.id;
  if (!isBuyer && !isSeller) return jsonError("Enquiry not found.", 404);
  if (enquiry.status === "closed") return jsonError("This enquiry is closed.");

  const message = await prisma.enquiryMessage.create({
    data: {
      enquiryId: enquiry.id,
      senderId: user.id,
      body: parsed.data.body,
    },
  });

  if (isSeller && enquiry.status === "pending") {
    await prisma.enquiry.update({
      where: { id: enquiry.id },
      data: { status: "replied" },
    });
  }

  return NextResponse.json({ id: message.id });
}
