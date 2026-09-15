"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
    <>
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="h-11 w-full justify-center">
              <SlidersHorizontal />
              Filters
              {hasActiveFilters(filters) ? (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[0.7rem] font-semibold text-primary-foreground">
                  Active
                </span>
              ) : null}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[min(100%,20rem)] gap-0 overflow-y-auto p-0"
          >
            <SheetHeader className="border-b px-6 py-4 pr-14 text-left">
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription className="sr-only">
                Filter listings by make, body type, district, price, and
                transmission
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-5 p-6 pb-10">
              <FilterFields
                idPrefix="m-"
                showHeading={false}
                filters={filters}
                makeOptions={makeOptions}
                priceRange={priceRange}
                onNavigate={navigate}
                onApply={apply}
                onPriceChange={setPriceRange}
                onPriceCommit={commitPrice}
                onToggleBody={toggleBody}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <aside className="hidden h-fit space-y-5 rounded-lg border bg-card p-5 shadow-sm lg:sticky lg:top-24 lg:block">
        <FilterFields
          idPrefix="d-"
          showHeading
          filters={filters}
          makeOptions={makeOptions}
          priceRange={priceRange}
          onNavigate={navigate}
          onApply={apply}
          onPriceChange={setPriceRange}
          onPriceCommit={commitPrice}
          onToggleBody={toggleBody}
        />
      </aside>
    </>
  );
}

function FilterFields({
  idPrefix,
  showHeading,
  filters,
  makeOptions,
  priceRange,
  onNavigate,
  onApply,
  onPriceChange,
  onPriceCommit,
  onToggleBody,
}: {
  idPrefix: string;
  showHeading: boolean;
  filters: ListingFilters;
  makeOptions: string[];
  priceRange: [number, number];
  onNavigate: (next: ListingFilters) => void;
  onApply: (patch: Partial<ListingFilters>) => void;
  onPriceChange: (value: [number, number]) => void;
  onPriceCommit: (value: [number, number]) => void;
  onToggleBody: (body: BodyType, checked: boolean) => void;
}) {
  return (
    <>
      {showHeading ? (
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Filters</h2>
          {hasActiveFilters(filters) ? (
            <button
              type="button"
              className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              onClick={() => onNavigate({ body: [], page: 1 })}
            >
              Clear all
            </button>
          ) : null}
        </div>
      ) : hasActiveFilters(filters) ? (
        <button
          type="button"
          className="inline-flex min-h-11 items-center text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          onClick={() => onNavigate({ body: [], page: 1 })}
        >
          Clear all
        </button>
      ) : null}

      {filters.city ? (
        <div className="flex min-h-11 items-center justify-between gap-2 rounded-md bg-muted px-3 py-2 text-xs">
          <span>
            Location:{" "}
            <span className="font-medium text-foreground">{filters.city}</span>
          </span>
          <button
            type="button"
            className="inline-flex min-h-11 items-center font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline lg:min-h-0"
            onClick={() => onApply({ city: undefined })}
          >
            Remove
          </button>
        </div>
      ) : null}

      <FilterGroup label="Make">
        <Select
          value={filters.make ?? ANY}
          onValueChange={(value) =>
            onApply({ make: value === ANY ? undefined : value })
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
        <div role="group" aria-label="Body type" className="space-y-0.5">
          {BODY_TYPES.map((body) => {
            const id = `${idPrefix}body-${body}`;
            return (
              <div key={body} className="flex min-h-11 items-center gap-2">
                <Checkbox
                  id={id}
                  checked={filters.body.includes(body)}
                  onCheckedChange={(checked) =>
                    onToggleBody(body, checked === true)
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
            onApply({
              district:
                value === ANY ? undefined : (value as ListingFilters["district"]),
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
            onPriceChange([value[0] ?? PRICE_MIN_MWK, value[1] ?? PRICE_MAX_MWK])
          }
          onValueCommit={(value) =>
            onPriceCommit([value[0] ?? PRICE_MIN_MWK, value[1] ?? PRICE_MAX_MWK])
          }
          aria-label="Price range in Malawian Kwacha"
          className="py-3"
        />
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="min-w-0 break-all">{formatMWK(priceRange[0])}</span>
          <span className="min-w-0 break-all text-right">
            {formatMWK(priceRange[1])}
          </span>
        </div>
      </FilterGroup>

      <Separator />

      <FilterGroup label="Transmission">
        <Select
          value={filters.transmission ?? ANY}
          onValueChange={(value) =>
            onApply({
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
    </>
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
