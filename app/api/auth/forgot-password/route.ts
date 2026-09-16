import { NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = forgotPasswordSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { name: true, email: true },
    });

    if (user) {
      await sendPasswordResetEmail(user.email, user.name);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to send password reset email", error);
    return NextResponse.json(
      { error: "Could not send a reset email. Try again." },
      { status: 500 },
    );
  }
}
