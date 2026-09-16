import { NextResponse } from "next/server";
import { resetPasswordWithToken } from "@/lib/password-reset";
import { resetPasswordSchema } from "@/lib/validations/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = resetPasswordSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Check the highlighted fields and try again." },
        { status: 400 },
      );
    }

    const result = await resetPasswordWithToken(
      parsed.data.email,
      parsed.data.token,
      parsed.data.password,
    );

    if (!result.ok) {
      return NextResponse.json(
        {
          error:
            result.reason === "expired"
              ? "That reset link has expired. Request a new one."
              : "That reset link is invalid. Request a new one.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to reset password", error);
    return NextResponse.json(
      { error: "Could not reset your password. Try again." },
      { status: 500 },
    );
  }
}
