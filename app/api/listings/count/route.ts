import { NextResponse } from "next/server";
import { countListings } from "@/lib/data";
import { parseListingSearchParams } from "@/lib/listing-filters";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = parseListingSearchParams(Object.fromEntries(searchParams.entries()));
  const total = await countListings(filters);
  return NextResponse.json({ total });
}
