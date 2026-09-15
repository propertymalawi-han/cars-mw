"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMWK } from "@/lib/currency";
import {
  PRICE_MAX_MWK,
  PRICE_MIN_MWK,
  PRICE_STEP_MWK,
  hasActiveFilters,
  listingsHref,
  type ListingFilters,
} from "@/lib/listing-filters";
import {
  BODY_TYPE_LABELS,
  BODY_TYPES,
  MALAWI_DISTRICTS,
  TRANSMISSIONS,
  type BodyType,
  type Transmission,
} from "@/types";

const ANY = "any";

type SearchFiltersProps = {
  filters: ListingFilters;
  makes: string[];
};

export function SearchFilters({ filters, makes }: SearchFiltersProps) {
  const router = useRouter();
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.minPrice ?? PRICE_MIN_MWK,
    filters.maxPrice ?? PRICE_MAX_MWK,
  ]);

  useEffect(() => {
    setPriceRange([
      filters.minPrice ?? PRICE_MIN_MWK,
      filters.maxPrice ?? PRICE_MAX_MWK,
    ]);
  }, [filters.minPrice, filters.maxPrice]);

  const makeOptions =
    filters.make && !makes.includes(filters.make)
      ? [filters.make, ...makes]
      : makes;

  function navigate(next: ListingFilters) {
    router.push(listingsHref(next), { scroll: false });
  }

  function apply(patch: Partial<ListingFilters>) {
    navigate({ ...filters, ...patch, page: 1 });
  }

  function commitPrice([min, max]: [number, number]) {
    apply({
      minPrice: min > PRICE_MIN_MWK ? min : undefined,
      maxPrice: max < PRICE_MAX_MWK ? max : undefined,
    });
  }

  function toggleBody(body: BodyType, checked: boolean) {
    const next = checked
      ? [...filters.body, body]
      : filters.body.filter((value) => value !== body);
    apply({ body: Array.from(new Set(next)) });
  }

  return (
    <aside className="h-fit space-y-5 rounded-lg border bg-card p-5 shadow-sm lg:sticky lg:top-24">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Filters</h2>
        {hasActiveFilters(filters) ? (
          <button
            type="button"
            className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            onClick={() =>
              navigate({ body: [], page: 1 })
            }
          >
            Clear all
          </button>
        ) : null}
      </div>

      {filters.city ? (
        <div className="flex items-center justify-between gap-2 rounded-md bg-muted px-3 py-2 text-xs">
          <span>
            Location: <span className="font-medium text-foreground">{filters.city}</span>
          </span>
          <button
            type="button"
            className="font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            onClick={() => apply({ city: undefined })}
          >
            Remove
          </button>
        </div>
      ) : null}

      <FilterGroup label="Make">
        <Select
          value={filters.make ?? ANY}
          onValueChange={(value) =>
            apply({ make: value === ANY ? undefined : value })
          }
        >
          <SelectTrigger aria-label="Make">
            <SelectValue placeholder="Any make" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any make</SelectItem>
            {makeOptions.map((make) => (
              <SelectItem key={make} value={make}>
                {make}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>

      <Separator />

      <FilterGroup label="Body type">
        <div role="group" aria-label="Body type" className="space-y-2.5">
          {BODY_TYPES.map((body) => {
            const id = `body-${body}`;
            return (
              <div key={body} className="flex items-center gap-2">
                <Checkbox
                  id={id}
                  checked={filters.body.includes(body)}
                  onCheckedChange={(checked) =>
                    toggleBody(body, checked === true)
                  }
                />
                <Label htmlFor={id} className="cursor-pointer font-normal">
                  {BODY_TYPE_LABELS[body]}
                </Label>
              </div>
            );
          })}
        </div>
      </FilterGroup>

      <Separator />

      <FilterGroup label="District">
        <Select
          value={filters.district ?? ANY}
          onValueChange={(value) =>
            apply({
              district: value === ANY ? undefined : (value as ListingFilters["district"]),
            })
          }
        >
          <SelectTrigger aria-label="District">
            <SelectValue placeholder="Any district" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any district</SelectItem>
            {MALAWI_DISTRICTS.map((district) => (
              <SelectItem key={district} value={district}>
                {district}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>

      <Separator />

      <FilterGroup label="Price (MWK)">
        <Slider
          min={PRICE_MIN_MWK}
          max={PRICE_MAX_MWK}
          step={PRICE_STEP_MWK}
          value={priceRange}
          onValueChange={(value) =>
            setPriceRange([value[0] ?? PRICE_MIN_MWK, value[1] ?? PRICE_MAX_MWK])
          }
          onValueCommit={(value) =>
            commitPrice([value[0] ?? PRICE_MIN_MWK, value[1] ?? PRICE_MAX_MWK])
          }
          aria-label="Price range in Malawian Kwacha"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatMWK(priceRange[0])}</span>
          <span>{formatMWK(priceRange[1])}</span>
        </div>
      </FilterGroup>

      <Separator />

      <FilterGroup label="Transmission">
        <Select
          value={filters.transmission ?? ANY}
          onValueChange={(value) =>
            apply({
              transmission:
                value === ANY ? undefined : (value as Transmission),
            })
          }
        >
          <SelectTrigger aria-label="Transmission">
            <SelectValue placeholder="Any transmission" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any transmission</SelectItem>
            {TRANSMISSIONS.map((transmission) => (
              <SelectItem key={transmission} value={transmission}>
                {transmission === "automatic" ? "Automatic" : "Manual"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>
    </aside>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}
