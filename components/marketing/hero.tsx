import type { ReactNode } from "react";
import Image from "next/image";
import { Briefcase, MapPin, ShieldCheck } from "lucide-react";
import { VehicleSearchBar } from "@/components/search/vehicle-search-bar";
import { getCategoryCounts, getMakeModelFacets } from "@/lib/data";
import { getPublicCategoryGroups } from "@/lib/catalog-status";
import { defaultListingFilters } from "@/lib/listing-filters";

const HERO_IMAGE =
  "/davinci_edit_i_need_an_image_for_a_car_listing_website_hero_ima-2.jpg";

export async function Hero() {
  const [categoryCounts, makeFacets, categoryGroups] = await Promise.all([
    getCategoryCounts(),
    getMakeModelFacets(defaultListingFilters()),
    getPublicCategoryGroups(),
  ]);
  const resultCount = categoryCounts.cars;

  return (
    <section className="relative">
      <div className="relative -mt-16 h-[32rem] sm:h-[38rem] lg:h-[min(50rem,60vw)]">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={HERO_IMAGE}
            alt="Land Cruiser driving along a lakeside road at sunset"
            fill
            priority
            quality={80}
            sizes="100vw"
            className="object-cover object-[center_82%]"
          />
          <div
            className="absolute inset-x-0 bottom-0 h-[36%] bg-gradient-to-t from-black/30 via-black/8 to-transparent"
            aria-hidden
          />
          <MalawiMap />
        </div>
        <span className="sr-only">
          Serving Mzuzu, Lilongwe, Zomba, and Blantyre
        </span>

        <div className="relative z-10 flex h-full flex-col justify-end px-4 pb-5 sm:px-6 sm:pb-8 lg:pb-10">
          <div className="mx-auto w-full max-w-site">
            <h1 className="text-balance text-center text-[clamp(1.7rem,1rem+2.4vw,2.75rem)] font-bold leading-[1.12] tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] sm:whitespace-nowrap">
              Find new & used cars for sale
            </h1>
            <div className="relative mt-5 w-full sm:mx-auto sm:mt-7 sm:max-w-[46rem]">
              <VehicleSearchBar
                categoryCounts={categoryCounts}
                resultCount={resultCount}
                makeFacets={makeFacets}
                categoryGroups={categoryGroups}
                className="mt-0 rounded-2xl border-0 bg-white p-2 shadow-lg sm:rounded-full sm:p-1.5"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="border-t">
        <div className="mx-auto flex w-full max-w-site flex-col px-4 py-2 sm:flex-row sm:items-stretch sm:px-6 sm:py-[22px]">
          {[
            {
              icon: <Briefcase className="h-5 w-5 text-copper" />,
              value: "3,240+",
              label: "cars listed",
            },
            {
              icon: <ShieldCheck className="h-5 w-5 text-copper" />,
              value: "180+",
              label: "verified dealers",
            },
            {
              icon: <MapPin className="h-5 w-5 text-copper" />,
              value: "28",
              label: "districts covered",
            },
          ].map((item, index) => (
            <TrustItem
              key={item.label}
              icon={item.icon}
              value={item.value}
              label={item.label}
              divided={index > 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustItem({
  icon,
  value,
  label,
  divided,
}: {
  icon: ReactNode;
  value: string;
  label: string;
  divided?: boolean;
}) {
  return (
    <div
      className={
        divided
          ? "flex flex-1 items-center gap-3 border-t py-3.5 sm:border-l sm:border-t-0 sm:px-5 sm:py-0"
          : "flex flex-1 items-center gap-3 py-3.5 sm:px-5 sm:py-0"
      }
    >
      {icon}
      <div>
        <strong className="block text-[1.15rem] font-bold">{value}</strong>
        <span className="text-[0.8rem] text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

function MalawiMap() {
  return (
    <div className="pointer-events-none absolute bottom-[24%] right-[12%] top-[16%] hidden w-[10rem] lg:block xl:right-[14%] xl:w-[11.5rem]">
      <svg
        viewBox="48 0 150 320"
        fill="none"
        className="h-full w-full overflow-visible drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)]"
        aria-hidden
      >
        <path
          d="M120 8c-10 14-8 26-18 34-14 11-30 8-36 22-7 16 6 24 2 40-4 15-20 20-18 36 2 15 18 18 20 32 2 13-9 20-4 34 6 16 24 16 28 30 4 13-4 22 4 34 7 11 22 10 28 22 5 11 0 22 8 30"
          stroke="rgba(255,255,255,0.88)"
          strokeWidth="4.5"
        />
        <path
          d="M118 10c-9 13-7 25-16 33-13 10-28 7-34 21-6 15 6 23 2 38-4 14-19 19-17 34 2 14 17 17 19 30 2 13-8 19-4 32 6 15 23 15 27 28 3 12-4 21 4 32 6 11 21 9 26 21 5 10 0 21 8 28"
          stroke="rgba(226,232,240,0.95)"
          strokeWidth="1.8"
        />
        <circle cx="80" cy="70" r="5" className="fill-copper" />
        <circle cx="70" cy="150" r="5" className="fill-copper" />
        <circle cx="88" cy="200" r="3.5" fill="#E8EEF4" />
        <circle cx="95" cy="235" r="5" className="fill-copper" />
        <g
          fill="#fff"
          fontSize="13"
          fontWeight="600"
          style={{ filter: "drop-shadow(0 1px 3px rgba(16,24,38,0.55))" }}
        >
          <text x="90" y="75">
            Mzuzu
          </text>
          <text x="80" y="155">
            Lilongwe
          </text>
          <text x="97" y="205">
            Zomba
          </text>
          <text x="105" y="240">
            Blantyre
          </text>
        </g>
      </svg>
    </div>
  );
}
