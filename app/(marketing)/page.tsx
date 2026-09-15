import { AboutSection } from "@/components/marketing/about-section";
import { BodyTypeTabs } from "@/components/marketing/body-type-tabs";
import { BrandGrid } from "@/components/marketing/brand-grid";
import { Hero } from "@/components/marketing/hero";
import { ListingsGrid } from "@/components/marketing/listings-grid";
import { LocationGrid } from "@/components/marketing/location-grid";
import { SellPanel } from "@/components/marketing/sell-panel";
import { ToolsSection } from "@/components/marketing/tools-section";

export const dynamic = "force-dynamic";

type MarketingPageProps = {
  searchParams: {
    body?: string;
  };
};

export default function MarketingPage({ searchParams }: MarketingPageProps) {
  return (
    <>
      <Hero />
      <BodyTypeTabs active={searchParams.body} />
      <ListingsGrid bodyType={searchParams.body} />
      <SellPanel />
      <BrandGrid />
      <LocationGrid />
      <ToolsSection />
      <AboutSection />
    </>
  );
}
