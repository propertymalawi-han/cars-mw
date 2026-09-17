import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseAuthClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const OTP_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

function asOtpType(value: string | null): EmailOtpType {
  if (value && OTP_TYPES.includes(value as EmailOtpType)) {
    return value as EmailOtpType;
  }
  return "email";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const supabase = createSupabaseAuthClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Failed to confirm email", error);
      redirect("/sign-in?error=Verification");
    }
    redirect("/sign-in?verified=1");
  }

  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      type: asOtpType(type),
      token_hash: tokenHash,
    });
    if (error) {
      console.error("Failed to confirm email", error);
      redirect("/sign-in?error=Verification");
    }
    redirect("/sign-in?verified=1");
  }

  redirect("/sign-in");
}
