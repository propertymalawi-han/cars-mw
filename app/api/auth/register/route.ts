import { NextResponse } from "next/server";
import { getEmailRedirectTo } from "@/lib/return-to";
import { createSupabaseAuthClient, getSupabase } from "@/lib/supabase/server";
import type { Json } from "@/types/database";
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
    const supabase = createSupabaseAuthClient();
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: getEmailRedirectTo(request),
        data: {
          name: input.name,
          phone: input.phone,
          account_type: input.accountType,
        },
      },
    });

    if (error) {
      const message = error.message.toLowerCase();
      if (
        error.code === "user_already_exists" ||
        message.includes("already registered") ||
        message.includes("already been registered")
      ) {
        return NextResponse.json(
          { error: "An account with this email already exists. Sign in instead." },
          { status: 409 },
        );
      }

      console.error("Failed to register", error);
      return NextResponse.json(
        { error: "Could not create your account. Try again." },
        { status: 500 },
      );
    }

    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return NextResponse.json(
        { error: "An account with this email already exists. Sign in instead." },
        { status: 409 },
      );
    }

    const { error: profileError } = await getSupabase().rpc("register_account", {
      payload: {
        email: input.email,
        name: input.name,
        phone: input.phone,
        accountType: input.accountType,
        dealerName: input.dealerName,
        dealerPhone: input.dealerPhone,
        whatsapp: input.whatsapp,
        districts: input.districts,
      } as Json,
    });

    if (profileError) {
      console.error("Failed to save account profile", profileError);
      return NextResponse.json(
        { error: "Could not create your account. Try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to register", error);
    return NextResponse.json(
      { error: "Could not create your account. Try again." },
      { status: 500 },
    );
  }
}
