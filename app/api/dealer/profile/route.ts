import { NextResponse } from "next/server";
import { uniqueDealerSlug } from "@/lib/dealer-slug";
import { requireDealerUser } from "@/lib/dealer";
import { jsonError } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { dealerProfileSchema } from "@/lib/validations/dealer";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const { user, dealer, response } = await requireDealerUser();
  if (!user || !dealer) return response;

  const parsed = dealerProfileSchema.safeParse(await request.json());
  if (!parsed.success) {
    return jsonError("Check the highlighted fields and try again.");
  }

  const slug =
    parsed.data.name === dealer.name
      ? dealer.slug
      : await uniqueDealerSlug(parsed.data.name, dealer.id);

  const updated = await prisma.dealer.update({
    where: { id: dealer.id },
    data: {
      name: parsed.data.name,
      slug,
      phone: parsed.data.phone,
      whatsapp: parsed.data.whatsapp,
      description: parsed.data.description,
      logoUrl: parsed.data.logoUrl || dealer.logoUrl,
      districts: parsed.data.districts,
    },
  });

  return NextResponse.json({ id: updated.id, slug: updated.slug });
}
