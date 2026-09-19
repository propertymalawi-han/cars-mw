import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin";
import { CatalogWriteError, patchMake } from "@/lib/admin-vehicle-data";
import { jsonError } from "@/lib/api-session";
import { adminMakePatchSchema } from "@/lib/validations/admin";

export const runtime = "nodejs";

type RouteContext = { params: { id: string } };

export async function PATCH(request: Request, { params }: RouteContext) {
  const { user, response } = await requireAdminUser();
  if (!user) return response;

  const parsed = adminMakePatchSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Could not update that make.");

  try {
    const updated = await patchMake(user.id, params.id, parsed.data);
    return NextResponse.json({ id: "id" in updated ? updated.id : params.id });
  } catch (error) {
    if (error instanceof CatalogWriteError) {
      return jsonError(error.message, error.status);
    }
    console.error("Failed to update make", error);
    return jsonError("Could not update that make.", 500);
  }
}
