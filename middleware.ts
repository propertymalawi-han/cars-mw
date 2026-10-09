import NextAuth from "next-auth";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { authConfig } from "@/auth.config";
import { isComingSoonEnabled, isComingSoonExemptPath } from "@/lib/coming-soon";
import { safeReturnTo } from "@/lib/return-to";

const { auth } = NextAuth(authConfig);

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isProtectedPath(pathname: string) {
  return (
    pathname === "/account" ||
    pathname.startsWith("/account/") ||
    pathname === "/dealer/dashboard" ||
    pathname.startsWith("/dealer/dashboard/") ||
    isAdminPath(pathname)
  );
}

function isStaffRole(role?: string | null) {
  return role === "admin" || role === "support";
}

function comingSoonRewrite(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/coming-soon";
  url.search = "";
  const response = NextResponse.rewrite(url);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

const protectRoutes = auth((req) => {
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

const holdPublicSite = auth((req) => {
  if (isStaffRole(req.auth?.user?.role)) {
    return NextResponse.next();
  }
  return comingSoonRewrite(req);
});

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  const pathname = req.nextUrl.pathname;

  if (pathname === "/coming-soon") {
    const enabled = await isComingSoonEnabled();
    if (!enabled) {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }
    return NextResponse.next();
  }

  if (!isComingSoonExemptPath(pathname) && (await isComingSoonEnabled())) {
    return holdPublicSite(req, event);
  }

  if (isProtectedPath(pathname)) {
    return protectRoutes(req, event);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
