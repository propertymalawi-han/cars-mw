import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireApiUser() {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, response: jsonError("Sign in to continue.", 401) };
  }
  return { user, response: null };
}
