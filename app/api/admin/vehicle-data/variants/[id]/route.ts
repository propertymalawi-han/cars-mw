import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin";
import { CatalogWriteError, patchVariant } from "@/lib/admin-vehicle-data";
import { jsonError } from "@/lib/api-session";
import { adminVariantPatchSchema } from "@/lib/validations/admin";

export const runtime = "nodejs";

type RouteContext = { params: { id: string } };

export async function PATCH(request: Request, { params }: RouteContext) {
  const { user, response } = await requireAdminUser();
  if (!user) return response;

  const parsed = adminVariantPatchSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Could not update that variant.");

  try {
    const updated = await patchVariant(user.id, params.id, parsed.data);
    return NextResponse.json({ id: "id" in updated ? updated.id : params.id });
  } catch (error) {
    if (error instanceof CatalogWriteError) {
      return jsonError(error.message, error.status);
    }
    console.error("Failed to update variant", error);
    return jsonError("Could not update that variant.", 500);
  }
}
