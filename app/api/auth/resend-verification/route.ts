import { NextResponse } from "next/server";
import { createSupabaseAuthClient } from "@/lib/supabase/server";
import { getEmailRedirectTo } from "@/lib/return-to";
import { resendVerificationSchema } from "@/lib/validations/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = resendVerificationSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
    }

    const supabase = createSupabaseAuthClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: parsed.data.email,
      options: { emailRedirectTo: getEmailRedirectTo(request) },
    });

    if (error) {
      console.error("Failed to resend verification email", error);
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
