import Link from "next/link";
import { Button } from "@/components/ui/button";

const BRANDS = [
  { name: "Toyota", count: "1,140" },
  { name: "Nissan", count: "610" },
  { name: "Honda", count: "402" },
  { name: "Mazda", count: "375" },
  { name: "Mitsubishi", count: "298" },
  { name: "Suzuki", count: "240" },
  { name: "Subaru", count: "187" },
  { name: "Isuzu", count: "156" },
] as const;

export function BrandGrid() {
  return (
    <section className="py-16">
      <div className="mx-auto w-full max-w-site px-6">
        <div className="mb-7">
          <h2 className="text-[1.35rem] font-bold tracking-tight">
            Popular brands
          </h2>
          <p className="mt-1 text-[0.9rem] text-muted-foreground">
            Browse by the makes Malawian buyers search for most.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {BRANDS.map((brand) => (
            <Button
              key={brand.name}
              variant="outline"
              className="h-auto justify-between px-4 py-3.5 text-[0.88rem] font-semibold shadow-none"
              asChild
            >
              <Link href={`/listings?make=${encodeURIComponent(brand.name)}`}>
                {brand.name}
                <span className="text-[0.8rem] font-normal text-muted-foreground">
                  {brand.count}
                </span>
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
