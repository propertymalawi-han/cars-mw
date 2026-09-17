import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/currency";
import { getDistrictCounts } from "@/lib/data";
import { defaultListingFilters, listingsHref } from "@/lib/listing-filters";
import { isDistrict } from "@/lib/vehicle-search";

export async function LocationGrid() {
  const districts = (await getDistrictCounts()).slice(0, 8);

  if (districts.length === 0) return null;

  return (
    <section className="pb-16 pt-0">
      <div className="mx-auto w-full max-w-site px-4 sm:px-6">
        <div className="mb-7">
          <h2 className="text-[clamp(1.15rem,0.95rem+1vw,1.35rem)] font-bold tracking-tight">
            Popular locations
          </h2>
          <p className="mt-1 text-[0.9rem] text-muted-foreground">
            Cars listed near you, from the north to the south.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {districts.map((location) => (
            <Button
              key={location.district}
              variant="outline"
              className="h-auto min-h-11 justify-between gap-2 whitespace-normal px-3 py-3.5 text-[0.88rem] font-semibold shadow-none sm:px-4"
              asChild
            >
              <Link
                href={
                  isDistrict(location.district)
                    ? listingsHref({
                        ...defaultListingFilters(),
                        districts: [location.district],
                      })
                    : `/listings?district=${encodeURIComponent(location.district)}`
                }
              >
                {location.district}
                <span className="text-[0.8rem] font-normal text-muted-foreground">
                  {formatNumber(location.count)}
                </span>
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
