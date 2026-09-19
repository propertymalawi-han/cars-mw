import { NextResponse } from "next/server";
import { jsonError, requireApiUser } from "@/lib/api-session";
import { findRecentDuplicateListing, listingWriteData } from "@/lib/listing-write";
import { buildListingTitle } from "@/lib/listing-title";
import { prisma } from "@/lib/prisma";
import { getSupabase } from "@/lib/supabase/server";
import type { Json } from "@/types/database";
import { listingSchema } from "@/lib/validations/listing";
import { revalidateListingsCache } from "@/lib/listings-cache";
import { jsonIfSuspended } from "@/lib/user-status";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { user, response } = await requireApiUser();
    if (!user) return response;
    if (!user.email) return jsonError("Sign in to continue.", 401);

    const suspended = await jsonIfSuspended(user.id);
    if (suspended) return suspended;

    const json = await request.json();
    const parsed = listingSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Check the highlighted fields and try again.",
          issues: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    if (process.env.DATABASE_URL) {
      const { mutedCatalogMessage } = await import("@/lib/catalog-status");
      const muted = await mutedCatalogMessage(parsed.data.make, parsed.data.model);
      if (muted) return jsonError(muted);

      const existing = await findRecentDuplicateListing(user.id, parsed.data);
      if (existing) {
        return NextResponse.json({ id: existing.id });
      }
    }

    if (process.env.DATABASE_URL && user.accountType === "dealer") {
      const listing = await prisma.listing.create({
        data: {
          ...listingWriteData(parsed.data),
          sellerId: user.id,
          sellerType: "dealer",
          status: "active",
        },
      });
      revalidateListingsCache();
      return NextResponse.json({ id: listing.id });
    }

    const { data, error } = await getSupabase().rpc("create_private_listing", {
      payload: {
        ...parsed.data,
        title: buildListingTitle(parsed.data),
        sellerEmail: user.email,
        sellerName: parsed.data.sellerName,
        phone: parsed.data.phone,
      } as unknown as Json,
    });

    if (error || !data) {
      console.error("Failed to publish listing", error);
      return jsonError(error?.message ?? "Could not publish the listing.", 502);
    }

    revalidateListingsCache();
    return NextResponse.json({ id: data });
  } catch (error) {
    console.error("Failed to publish listing", error);
    return jsonError("Could not publish the listing.", 500);
  }
}
