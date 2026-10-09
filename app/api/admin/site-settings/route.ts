import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin";
import { logAdminAction } from "@/lib/adminAudit";
import { jsonError } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { invalidateSiteSettingsCache, SITE_SETTING_ID } from "@/lib/site-settings";
import { adminSiteSettingsSchema } from "@/lib/validations/admin";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const { user: admin, response } = await requireAdminUser();
  if (!admin) return response;

  const parsed = adminSiteSettingsSchema.safeParse(await request.json());
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Could not update site settings.");
  }

  const previous = await prisma.siteSetting.findUnique({
    where: { id: SITE_SETTING_ID },
    select: { comingSoonEnabled: true, comingSoonMessage: true },
  });

  const comingSoonEnabled = parsed.data.comingSoonEnabled;
  const comingSoonMessage = parsed.data.comingSoonMessage;
  const previousEnabled = previous?.comingSoonEnabled ?? false;
  const previousMessage = previous?.comingSoonMessage ?? "";

  const updated = await prisma.siteSetting.upsert({
    where: { id: SITE_SETTING_ID },
    create: {
      id: SITE_SETTING_ID,
      comingSoonEnabled,
      comingSoonMessage,
      updatedById: admin.id,
    },
    update: {
      comingSoonEnabled,
      comingSoonMessage,
      updatedById: admin.id,
    },
    select: {
      comingSoonEnabled: true,
      comingSoonMessage: true,
    },
  });

  if (previousEnabled !== updated.comingSoonEnabled) {
    await logAdminAction({
      adminUserId: admin.id,
      action: updated.comingSoonEnabled
        ? "site.coming_soon_enable"
        : "site.coming_soon_disable",
      targetType: "site",
      targetId: SITE_SETTING_ID,
      metadata: { message: updated.comingSoonMessage },
    });
  } else if (previousMessage !== updated.comingSoonMessage) {
    await logAdminAction({
      adminUserId: admin.id,
      action: "site.coming_soon_message",
      targetType: "site",
      targetId: SITE_SETTING_ID,
      metadata: { message: updated.comingSoonMessage },
    });
  }

  invalidateSiteSettingsCache();
  revalidatePath("/", "layout");

  return NextResponse.json(updated);
}
