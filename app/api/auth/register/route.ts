import { NextResponse } from "next/server";
import { uniqueDealerSlug } from "@/lib/dealer-slug";
import { sendVerificationEmail } from "@/lib/email-verification";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { signUpSchema } from "@/lib/validations/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = signUpSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Check the highlighted fields and try again.",
          issues: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const passwordHash = await hashPassword(input.password);
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
      include: { dealer: true },
    });

    if (existing?.passwordHash) {
      return NextResponse.json(
        { error: "An account with this email already exists. Sign in instead." },
        { status: 409 },
      );
    }

    const dealerSlug =
      input.accountType === "dealer" && !existing?.dealer
        ? await uniqueDealerSlug(input.dealerName)
        : null;

    await prisma.$transaction(async (tx) => {
      const user = existing
        ? await tx.user.update({
            where: { id: existing.id },
            data: {
              name: input.name,
              phone: input.phone || existing.phone,
              passwordHash,
              accountType: input.accountType === "dealer" ? "dealer" : existing.accountType,
              role: input.accountType === "dealer" ? "dealer" : existing.role,
            },
          })
        : await tx.user.create({
            data: {
              name: input.name,
              email: input.email,
              phone: input.phone || null,
              passwordHash,
              accountType: input.accountType,
              role: input.accountType === "dealer" ? "dealer" : "user",
            },
          });

      if (input.accountType === "dealer" && dealerSlug && !existing?.dealer) {
        await tx.dealer.create({
          data: {
            name: input.dealerName,
            slug: dealerSlug,
            phone: input.dealerPhone,
            whatsapp: input.whatsapp,
            districts: [...input.districts],
            verified: false,
            userId: user.id,
          },
        });
      }
    });

    await sendVerificationEmail(input.email, input.name);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to register", error);
    return NextResponse.json(
      { error: "Could not create your account. Try again." },
      { status: 500 },
    );
  }
}
