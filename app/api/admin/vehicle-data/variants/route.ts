import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin";
import { CatalogWriteError, createVariant } from "@/lib/admin-vehicle-data";
import { jsonError } from "@/lib/api-session";
import { adminVariantCreateSchema } from "@/lib/validations/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { user, response } = await requireAdminUser();
  if (!user) return response;

  const parsed = adminVariantCreateSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Could not create that variant.");

  try {
    const created = await createVariant(user.id, parsed.data);
    return NextResponse.json({ id: created.id });
  } catch (error) {
    if (error instanceof CatalogWriteError) {
      return jsonError(error.message, error.status);
    }
    console.error("Failed to create variant", error);
    return jsonError("Could not create that variant.", 500);
  }
}
