import { NextResponse } from "next/server";
import { createSupabaseAuthClient } from "@/lib/supabase/server";
import { getEmailRedirectTo } from "@/lib/return-to";
import { forgotPasswordSchema } from "@/lib/validations/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = forgotPasswordSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
    }

    const supabase = createSupabaseAuthClient();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: getEmailRedirectTo(request, "/reset-password"),
    });

    if (error) {
      console.error("Failed to send password reset email", error);
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
