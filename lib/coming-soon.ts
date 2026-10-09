const SETTINGS_TTL_MS = 3_000;
const SETTINGS_TIMEOUT_MS = 1_500;

type ComingSoonCache = {
  enabled: boolean;
  at: number;
};

let comingSoonCache: ComingSoonCache | null = null;

export function isComingSoonExemptPath(pathname: string) {
  if (pathname === "/coming-soon" || pathname.startsWith("/coming-soon/")) return true;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return true;
  if (pathname === "/api" || pathname.startsWith("/api/")) return true;
  if (pathname === "/auth" || pathname.startsWith("/auth/")) return true;
  if (pathname === "/sign-in" || pathname.startsWith("/sign-in/")) return true;
  if (pathname === "/forgot-password" || pathname.startsWith("/forgot-password/")) return true;
  if (pathname === "/reset-password" || pathname.startsWith("/reset-password/")) return true;
  if (pathname === "/verify-email" || pathname.startsWith("/verify-email/")) return true;
  if (pathname === "/403" || pathname.startsWith("/403/")) return true;
  return false;
}

export async function isComingSoonEnabled() {
  if (comingSoonCache && Date.now() - comingSoonCache.at < SETTINGS_TTL_MS) {
    return comingSoonCache.enabled;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return comingSoonCache?.enabled ?? false;
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/site_settings?id=eq.site&select=coming_soon_enabled`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(SETTINGS_TIMEOUT_MS),
      },
    );

    if (!response.ok) {
      return comingSoonCache?.enabled ?? false;
    }

    const rows = (await response.json()) as { coming_soon_enabled?: boolean }[];
    const enabled = Boolean(rows[0]?.coming_soon_enabled);
    comingSoonCache = { enabled, at: Date.now() };
    return enabled;
  } catch (error) {
    console.error("Failed to read coming soon flag", error);
    return comingSoonCache?.enabled ?? false;
  }
}
