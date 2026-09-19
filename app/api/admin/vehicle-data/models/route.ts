import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin";
import { CatalogWriteError, createModel } from "@/lib/admin-vehicle-data";
import { jsonError } from "@/lib/api-session";
import { adminModelCreateSchema } from "@/lib/validations/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { user, response } = await requireAdminUser();
  if (!user) return response;

  const parsed = adminModelCreateSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Could not create that model.");

  try {
    const created = await createModel(user.id, parsed.data);
    return NextResponse.json({ id: created.id });
  } catch (error) {
    if (error instanceof CatalogWriteError) {
      return jsonError(error.message, error.status);
    }
    console.error("Failed to create model", error);
    return jsonError("Could not create that model.", 500);
  }
}
