import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin";
import { CatalogWriteError, createCategory } from "@/lib/admin-vehicle-data";
import { jsonError } from "@/lib/api-session";
import { adminCategoryCreateSchema } from "@/lib/validations/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { user, response } = await requireAdminUser();
  if (!user) return response;

  const parsed = adminCategoryCreateSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Could not create that category.");

  try {
    const created = await createCategory(user.id, parsed.data);
    return NextResponse.json({ id: created.id });
  } catch (error) {
    if (error instanceof CatalogWriteError) {
      return jsonError(error.message, error.status);
    }
    console.error("Failed to create category", error);
    return jsonError("Could not create that category.", 500);
  }
}
