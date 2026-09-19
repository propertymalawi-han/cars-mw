export function isGoogleAuthEnabled() {
  return Boolean(
    process.env.AUTH_GOOGLE_ID &&
      process.env.AUTH_GOOGLE_SECRET &&
      process.env.DATABASE_URL,
  );
}

export function isConfiguredAdminEmail(email?: string | null) {
  const configured = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!configured || !email) return false;
  return email.trim().toLowerCase() === configured;
}
