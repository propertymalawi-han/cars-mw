import type { ReactNode } from "react";
import Link from "next/link";
import { Briefcase, MapPin, ShieldCheck } from "lucide-react";
import { SearchPanel } from "@/components/marketing/search-panel";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative pt-8 sm:pt-12 lg:pt-16">
      <div className="mx-auto w-full max-w-site px-4 sm:px-6">
        <div className="grid items-center gap-8 sm:gap-10 lg:grid-cols-[1fr_0.85fr] lg:gap-12">
          <div className="min-w-0">
            <h1 className="max-w-[18ch] text-balance text-[clamp(1.85rem,1.1rem+3.2vw,3rem)] font-bold leading-[1.12] tracking-tight sm:max-w-[15ch]">
              Malawi&apos;s marketplace for buying and selling cars
            </h1>
            <p className="mt-4 max-w-[42ch] text-[1.02rem] text-muted-foreground">
              Search thousands of vehicles from verified dealers and private
              sellers, from Lilongwe to Mzuzu.
            </p>
            <div className="mt-6 flex flex-col gap-3 xs:flex-row xs:flex-wrap">
              <Button size="lg" className="w-full xs:w-auto" asChild>
                <Link href="#listings">Browse listings</Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full xs:w-auto" asChild>
                <Link href="/sell">List your car</Link>
              </Button>
            </div>
          </div>
          <MalawiMap />
        </div>
        <SearchPanel />
      </div>
      <div className="mt-8 border-t sm:mt-11">
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
    <div className="relative mx-auto hidden h-[200px] w-full max-w-xs sm:block lg:h-[300px] lg:max-w-none">
      <svg viewBox="0 0 260 320" fill="none" className="h-full w-full" aria-hidden>
        <path
          d="M120 8c-10 14-8 26-18 34-14 11-30 8-36 22-7 16 6 24 2 40-4 15-20 20-18 36 2 15 18 18 20 32 2 13-9 20-4 34 6 16 24 16 28 30 4 13-4 22 4 34 7 11 22 10 28 22 5 11 0 22 8 30"
          className="stroke-border"
          strokeWidth="2"
        />
        <path
          d="M118 10c-9 13-7 25-16 33-13 10-28 7-34 21-6 15 6 23 2 38-4 14-19 19-17 34 2 14 17 17 19 30 2 13-8 19-4 32 6 15 23 15 27 28 3 12-4 21 4 32 6 11 21 9 26 21 5 10 0 21 8 28"
          className="stroke-foreground/55"
          strokeWidth="2"
        />
        <circle cx="80" cy="70" r="4" className="fill-copper" />
        <text x="90" y="73" className="fill-muted-foreground text-[9px] font-semibold">
          Mzuzu
        </text>
        <circle cx="70" cy="150" r="4" className="fill-copper" />
        <text x="80" y="153" className="fill-muted-foreground text-[9px] font-semibold">
          Lilongwe
        </text>
        <circle cx="95" cy="235" r="4" className="fill-copper" />
        <text x="105" y="238" className="fill-muted-foreground text-[9px] font-semibold">
          Blantyre
        </text>
        <circle cx="88" cy="200" r="3" className="fill-muted-foreground" />
        <text x="97" y="203" className="fill-muted-foreground text-[9px] font-semibold">
          Zomba
        </text>
      </svg>
    </div>
  );
}
