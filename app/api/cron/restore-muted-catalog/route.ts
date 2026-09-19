import { NextResponse } from "next/server";
import { restoreExpiredCatalogMutes } from "@/lib/catalog-status";

export const runtime = "nodejs";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization");
  if (secret) return auth === `Bearer ${secret}`;
  if (process.env.NODE_ENV !== "production") return true;
  return request.headers.get("x-vercel-cron") === "1";
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const restored = await restoreExpiredCatalogMutes();
  return NextResponse.json({ restored });
}
