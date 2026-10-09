import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/coming-soon-page";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Coming soon",
  description: "CarsMW is being updated and will be back shortly.",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const settings = await getSiteSettings();
  return <ComingSoonPage message={settings.comingSoonMessage} />;
}
