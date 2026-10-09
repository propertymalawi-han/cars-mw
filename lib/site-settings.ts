import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isStaffRole } from "@/types";

export const SITE_SETTING_ID = "site";

export const DEFAULT_COMING_SOON_MESSAGE =
  "CarsMW is being updated. Buying and selling cars in Malawi will be back shortly.";

export type SiteSettings = {
  comingSoonEnabled: boolean;
  comingSoonMessage: string;
};

const EMPTY_SETTINGS: SiteSettings = {
  comingSoonEnabled: false,
  comingSoonMessage: "",
};

const SETTINGS_TTL_MS = 3_000;

let cachedSettings: { at: number; value: SiteSettings } | null = null;

export function invalidateSiteSettingsCache() {
  cachedSettings = null;
}

async function readSiteSettings(): Promise<SiteSettings | null> {
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { id: SITE_SETTING_ID },
      select: {
        comingSoonEnabled: true,
        comingSoonMessage: true,
      },
    });
    if (!row) return EMPTY_SETTINGS;
    return {
      comingSoonEnabled: row.comingSoonEnabled,
      comingSoonMessage: row.comingSoonMessage,
    };
  } catch (error) {
    console.error("Failed to read site settings", error);
    return null;
  }
}

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  if (cachedSettings && Date.now() - cachedSettings.at < SETTINGS_TTL_MS) {
    return cachedSettings.value;
  }

  const value = await readSiteSettings();
  if (!value) return cachedSettings?.value ?? EMPTY_SETTINGS;

  cachedSettings = { at: Date.now(), value };
  return value;
});

export function comingSoonCopy(message: string) {
  const trimmed = message.trim();
  return trimmed || DEFAULT_COMING_SOON_MESSAGE;
}

export async function staffCanPreviewSite() {
  try {
    const user = await getCurrentUser();
    if (!user) return false;
    if (isStaffRole(user.role)) return true;

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });
    return isStaffRole(dbUser?.role);
  } catch (error) {
    console.error("Failed to check staff site preview", error);
    return false;
  }
}
