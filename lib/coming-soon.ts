const FRESH_FOR_MS = 15_000;
const FAILURE_BACKOFF_MS = 5_000;
const SETTINGS_TIMEOUT_MS = 1_500;

type ComingSoonCache = {
  enabled: boolean;
  at: number;
};

type WaitUntil = (promise: Promise<unknown>) => void;

let comingSoonCache: ComingSoonCache | null = null;
let refreshPromise: Promise<void> | null = null;
let suppressRefreshUntil = 0;

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

async function readComingSoonEnabled(): Promise<
  { status: "ok"; enabled: boolean } | { status: "unconfigured" } | { status: "failed" }
> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return { status: "unconfigured" };

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

  if (!response.ok) return { status: "failed" };

  const rows = (await response.json()) as { coming_soon_enabled?: boolean }[];
  return { status: "ok", enabled: Boolean(rows[0]?.coming_soon_enabled) };
}

function refreshComingSoon(): Promise<void> {
  if (refreshPromise) return refreshPromise;

  const pending = (async () => {
    try {
      const result = await readComingSoonEnabled();
      if (result.status === "unconfigured") return;
      if (result.status === "failed") {
        suppressRefreshUntil = Date.now() + FAILURE_BACKOFF_MS;
        return;
      }
      comingSoonCache = { enabled: result.enabled, at: Date.now() };
    } catch (error) {
      console.error("Failed to read coming soon flag", error);
      suppressRefreshUntil = Date.now() + FAILURE_BACKOFF_MS;
    }
  })().finally(() => {
    if (refreshPromise === pending) refreshPromise = null;
  });

  refreshPromise = pending;
  return pending;
}

export async function isComingSoonEnabled(waitUntil?: WaitUntil) {
  const now = Date.now();
  const snapshot = comingSoonCache;

  if (!snapshot) {
    if (now < suppressRefreshUntil) return false;
    await refreshComingSoon();
    return comingSoonCache?.enabled ?? false;
  }

  if (now - snapshot.at >= FRESH_FOR_MS && now >= suppressRefreshUntil) {
    waitUntil?.(refreshComingSoon());
  }

  return snapshot.enabled;
}
