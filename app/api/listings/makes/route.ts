import { NextResponse } from "next/server";
import { getMakeModelFacets } from "@/lib/data";
import { parseListingSearchParams } from "@/lib/listing-filters";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = parseListingSearchParams(Object.fromEntries(searchParams.entries()));
  const makes = await getMakeModelFacets(filters);
  return NextResponse.json({ makes });
}
