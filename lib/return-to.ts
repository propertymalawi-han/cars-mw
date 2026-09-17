export function getAppUrl() {
  const url =
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  return url.replace(/\/$/, "");
}

export function getRequestOrigin(request: Request) {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwardedHost) {
    return `${forwardedProto || url.protocol.replace(":", "")}://${forwardedHost}`;
  }
  return url.origin;
}

export function getEmailRedirectTo(request: Request, path = "/auth/callback") {
  return `${getRequestOrigin(request)}${path}`;
}

export function safeReturnTo(value: string | string[] | undefined | null, fallback = "/") {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate) return fallback;
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return fallback;
  if (
    candidate.startsWith("/sign-in") ||
    candidate.startsWith("/sign-up") ||
    candidate.startsWith("/forgot-password") ||
    candidate.startsWith("/reset-password") ||
    candidate.startsWith("/verify-email")
  ) {
    return fallback;
  }
  return candidate;
}

export function withReturnTo(href: string, returnTo?: string | null) {
  if (!returnTo) return href;
  const url = new URL(href, "http://cars.mw");
  url.searchParams.set("returnTo", returnTo);
  return `${url.pathname}${url.search}`;
}
