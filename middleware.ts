import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { safeReturnTo } from "@/lib/return-to";

const { auth } = NextAuth(authConfig);

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export default auth((req) => {
  const pathname = req.nextUrl.pathname;
  const isLoggedIn = Boolean(req.auth?.user);

  if (isAdminPath(pathname)) {
    if (!isLoggedIn) {
      const signInUrl = new URL("/sign-in", req.nextUrl.origin);
      const returnTo = safeReturnTo(`${pathname}${req.nextUrl.search}`, "/admin");
      signInUrl.searchParams.set("returnTo", returnTo);
      return NextResponse.redirect(signInUrl);
    }

    // Role is enforced in requireAdminPage so a stale JWT cannot 403 a staff user.
    return NextResponse.next();
  }

  if (isLoggedIn) {
    return NextResponse.next();
  }

  const signInUrl = new URL("/sign-in", req.nextUrl.origin);
  const returnTo = safeReturnTo(`${pathname}${req.nextUrl.search}`, "/account");
  signInUrl.searchParams.set("returnTo", returnTo);
  return NextResponse.redirect(signInUrl);
});

export const config = {
  matcher: [
    "/account",
    "/account/:path*",
    "/dealer/dashboard",
    "/dealer/dashboard/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
