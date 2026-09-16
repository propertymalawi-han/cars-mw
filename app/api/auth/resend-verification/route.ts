import { NextResponse } from "next/server";
import { sendVerificationEmail } from "@/lib/email-verification";
import { prisma } from "@/lib/prisma";
import { resendVerificationSchema } from "@/lib/validations/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = resendVerificationSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { name: true, email: true, emailVerified: true, passwordHash: true },
    });

    if (user && !user.emailVerified && user.passwordHash) {
      await sendVerificationEmail(user.email, user.name);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to resend verification email", error);
    return NextResponse.json(
      { error: "Could not send a verification email. Try again." },
      { status: 500 },
    );
  }
}
