import { NextResponse } from "next/server";
import { sendVerificationEmail } from "@/lib/email-verification";
import { requireApiUser, jsonError } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validations/account";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success) {
    return jsonError("Check the highlighted fields and try again.");
  }

  const current = await prisma.user.findUnique({ where: { id: user.id } });
  if (!current) return jsonError("Account not found.", 404);

  const emailChanged = parsed.data.email !== current.email;
  if (emailChanged) {
    const taken = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true },
    });
    if (taken && taken.id !== user.id) {
      return jsonError("That email is already in use.", 409);
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      avatarUrl: parsed.data.avatarUrl || current.avatarUrl,
      emailVerified: emailChanged ? null : current.emailVerified,
    },
  });

  if (emailChanged) {
    await sendVerificationEmail(parsed.data.email, parsed.data.name);
  }

  return NextResponse.json({ ok: true, emailVerificationSent: emailChanged });
}
