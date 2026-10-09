import type { ReactNode } from "react";
import { StaffComingSoonBanner } from "@/components/coming-soon-page";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSiteSettings, staffCanPreviewSite } from "@/lib/site-settings";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const settings = await getSiteSettings();
  const showStaffBanner = settings.comingSoonEnabled && (await staffCanPreviewSite());

  return (
    <div className="flex min-h-screen flex-col">
      {showStaffBanner ? <StaffComingSoonBanner /> : null}
      <SiteHeader />
      <main className="min-w-0 flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
