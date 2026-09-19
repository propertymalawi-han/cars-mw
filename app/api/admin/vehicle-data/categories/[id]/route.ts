import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin";
import { CatalogWriteError, patchCategory } from "@/lib/admin-vehicle-data";
import { jsonError } from "@/lib/api-session";
import { adminCategoryPatchSchema } from "@/lib/validations/admin";

export const runtime = "nodejs";

type RouteContext = { params: { id: string } };

export async function PATCH(request: Request, { params }: RouteContext) {
  const { user, response } = await requireAdminUser();
  if (!user) return response;

  const parsed = adminCategoryPatchSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Could not update that category.");

  try {
    const updated = await patchCategory(user.id, params.id, parsed.data);
    return NextResponse.json({ id: "id" in updated ? updated.id : params.id });
  } catch (error) {
    if (error instanceof CatalogWriteError) {
      return jsonError(error.message, error.status);
    }
    console.error("Failed to update category", error);
    return jsonError("Could not update that category.", 500);
  }
}
