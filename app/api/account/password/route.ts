import { NextResponse } from "next/server";
import { requireApiUser, jsonError } from "@/lib/api-session";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema } from "@/lib/validations/account";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const parsed = changePasswordSchema.safeParse(await request.json());
  if (!parsed.success) {
    return jsonError("Check the highlighted fields and try again.");
  }

  const current = await prisma.user.findUnique({ where: { id: user.id } });
  if (!current) return jsonError("Account not found.", 404);

  if (current.passwordHash) {
    if (!parsed.data.currentPassword) {
      return jsonError("Enter your current password.");
    }
    const valid = await verifyPassword(parsed.data.currentPassword, current.passwordHash);
    if (!valid) {
      return jsonError("Current password is incorrect.");
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.password) },
  });

  return NextResponse.json({ ok: true });
}
