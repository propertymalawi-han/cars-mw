import { AboutSection } from "@/components/marketing/about-section";
import { FeaturedListings } from "@/components/marketing/featured-listings";
import { Hero } from "@/components/marketing/hero";
import { BrandGrid } from "@/components/marketing/brand-grid";
import { LocationGrid } from "@/components/marketing/location-grid";
import { SellPanel } from "@/components/marketing/sell-panel";
import { ToolsSection } from "@/components/marketing/tools-section";
import { getHomeFeaturedSections, searchListings } from "@/lib/data";
import { defaultListingFilters } from "@/lib/listing-filters";

export const revalidate = 120;

export default async function MarketingPage() {
  const [sections] = await Promise.all([
    getHomeFeaturedSections(),
    searchListings(defaultListingFilters()),
  ]);

  return (
    <>
      <Hero />
      <FeaturedListings sections={sections} />
      <SellPanel />
      <BrandGrid />
      <LocationGrid />
      <ToolsSection />
      <AboutSection />
    </>
  );
}
