import { AboutSection } from "@/components/marketing/about-section";
import { FeaturedListings } from "@/components/marketing/featured-listings";
import { Hero } from "@/components/marketing/hero";
import { BrandGrid } from "@/components/marketing/brand-grid";
import { LocationGrid } from "@/components/marketing/location-grid";
import { SellPanel } from "@/components/marketing/sell-panel";
import { ToolsSection } from "@/components/marketing/tools-section";
import { getHomeFeaturedSections } from "@/lib/data";

export const revalidate = 120;

async function HomeFeatured() {
  const sections = await getHomeFeaturedSections();
  return <FeaturedListings sections={sections} />;
}

export default function MarketingPage() {
  return (
    <>
      <Hero />
      <HomeFeatured />
      <SellPanel />
      <BrandGrid />
      <LocationGrid />
      <ToolsSection />
      <AboutSection />
    </>
  );
}
