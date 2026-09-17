import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/currency";
import { getMakeModelFacets } from "@/lib/data";
import { defaultListingFilters } from "@/lib/listing-filters";

export async function BrandGrid() {
  const facets = await getMakeModelFacets(defaultListingFilters());
  const brands = facets.slice().sort((a, b) => b.count - a.count).slice(0, 8);

  if (brands.length === 0) return null;

  return (
    <section className="py-16">
      <div className="mx-auto w-full max-w-site px-4 sm:px-6">
        <div className="mb-7">
          <h2 className="text-[clamp(1.15rem,0.95rem+1vw,1.35rem)] font-bold tracking-tight">
            Popular brands
          </h2>
          <p className="mt-1 text-[0.9rem] text-muted-foreground">
            Browse by the makes Malawian buyers search for most.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {brands.map((brand) => (
            <Button
              key={brand.make}
              variant="outline"
              className="h-auto min-h-11 justify-between gap-2 whitespace-normal px-3 py-3.5 text-[0.88rem] font-semibold shadow-none sm:px-4"
              asChild
            >
              <Link href={`/listings?make=${encodeURIComponent(brand.make)}`}>
                {brand.make}
                <span className="text-[0.8rem] font-normal text-muted-foreground">
                  {formatNumber(brand.count)}
                </span>
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
