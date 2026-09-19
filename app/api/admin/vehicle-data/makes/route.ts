import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin";
import { CatalogWriteError, createMake } from "@/lib/admin-vehicle-data";
import { jsonError } from "@/lib/api-session";
import { adminMakeCreateSchema } from "@/lib/validations/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { user, response } = await requireAdminUser();
  if (!user) return response;

  const parsed = adminMakeCreateSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Could not create that make.");

  try {
    const created = await createMake(user.id, parsed.data);
    return NextResponse.json({ id: created.id });
  } catch (error) {
    if (error instanceof CatalogWriteError) {
      return jsonError(error.message, error.status);
    }
    console.error("Failed to create make", error);
    return jsonError("Could not create that make.", 500);
  }
}
