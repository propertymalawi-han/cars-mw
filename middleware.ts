import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { safeReturnTo } from "@/lib/return-to";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = Boolean(req.auth?.user);
  if (isLoggedIn) {
    return NextResponse.next();
  }

  const signInUrl = new URL("/sign-in", req.nextUrl.origin);
  const returnTo = safeReturnTo(`${req.nextUrl.pathname}${req.nextUrl.search}`, "/account");
  signInUrl.searchParams.set("returnTo", returnTo);
  return NextResponse.redirect(signInUrl);
});

export const config = {
  matcher: ["/account", "/account/:path*", "/dealer/dashboard", "/dealer/dashboard/:path*"],
};
