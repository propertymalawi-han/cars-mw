import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { listingWriteData } from "@/lib/listing-write";
import { prisma } from "@/lib/prisma";
import { buildListingTitle } from "@/lib/listing-title";
import { getSupabase } from "@/lib/supabase/server";
import type { Json } from "@/types/database";
import { listingSchema } from "@/lib/validations/listing";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
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

    const user = await getCurrentUser();
    if (user) {
      const listing = await prisma.listing.create({
        data: {
          ...listingWriteData(parsed.data),
          sellerId: user.id,
          sellerType: user.accountType === "dealer" ? "dealer" : "private",
          status: "active",
        },
      });
      return NextResponse.json({ id: listing.id });
    }

    const listing = {
      ...parsed.data,
      title: buildListingTitle(parsed.data),
    };

    const { data, error } = await getSupabase().rpc("create_private_listing", {
      payload: listing as unknown as Json,
    });

    if (error || !data) {
      console.error("Failed to publish listing", error);
      return NextResponse.json(
        { error: error?.message ?? "Could not publish the listing." },
        { status: 502 },
      );
    }

    return NextResponse.json({ id: data });
  } catch (error) {
    console.error("Failed to publish listing", error);
    return NextResponse.json(
      { error: "Could not publish the listing." },
      { status: 500 },
    );
  }
}
