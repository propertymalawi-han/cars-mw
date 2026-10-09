import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-session";
import { UploadError, uploadListingPhoto } from "@/lib/uploads";
import { jsonIfSuspended } from "@/lib/user-status";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const suspended = await jsonIfSuspended(user.id);
  if (suspended) return suspended;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose a photo to upload." }, { status: 400 });
    }

    const result = await uploadListingPhoto(file);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Photo upload failed", error);
    return NextResponse.json({ error: "Could not upload that photo." }, { status: 500 });
  }
}
