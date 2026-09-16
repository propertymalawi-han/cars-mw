"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Car, MapPin } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatBand, searchActionLabel } from "@/lib/vehicle-search";
import { sectionFilterCount, type ListingFilters } from "@/lib/listing-filters";
import {
  COLOURS,
  DRIVETRAINS,
  INSTALMENT_BANDS,
  MILEAGE_BANDS,
  OPEN_ENDED_INSTALMENT,
  OPEN_ENDED_MILEAGE,
  OPEN_ENDED_PRICE,
  PICKER_DISTRICTS,
  PRICE_BANDS,
  SEAT_OPTIONS,
  YEAR_MAX,
  YEAR_MIN,
  bodyTypesForCategory,
  type PricingMode,
} from "@/lib/vehicle-search";
import { FUEL_TYPES } from "@/types";

const ANY = "any";
const YEARS = Array.from(
  { length: YEAR_MAX - YEAR_MIN + 1 },
  (_, index) => YEAR_MAX - index,
);

const FUEL_LABELS: Record<(typeof FUEL_TYPES)[number], string> = {
  petrol: "Petrol",
  diesel: "Diesel",
  hybrid: "Hybrid",
  electric: "Electric",
};

type FilterSidebarProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ListingFilters;
  onChange: (patch: Partial<ListingFilters>) => void;
  resultCount: number;
  onApply: () => void;
  onReset: () => void;
};

function openSectionsFor(filters: ListingFilters): string[] {
  const sections: string[] = [];
  if (sectionFilterCount("districts", filters)) sections.push("locations");
  if (sectionFilterCount("bodyTypes", filters)) sections.push("body");
  if (sectionFilterCount("years", filters)) sections.push("years");
  if (sectionFilterCount("mileage", filters)) sections.push("mileage");
  if (sectionFilterCount("transmission", filters)) sections.push("transmission");
  if (sectionFilterCount("condition", filters)) sections.push("condition");
  if (sectionFilterCount("fuelTypes", filters)) sections.push("fuel");
  if (sectionFilterCount("drivetrain", filters)) sections.push("drivetrain");
  if (sectionFilterCount("colours", filters)) sections.push("colour");
  if (sectionFilterCount("sellerType", filters)) sections.push("seller");
  if (sectionFilterCount("seats", filters)) sections.push("seats");
  return sections;
}

export function FilterSidebar({
  open,
  onOpenChange,
  filters,
  onChange,
  resultCount,
  onApply,
  onReset,
}: FilterSidebarProps) {
  const bodyTypes = bodyTypesForCategory(filters.category);
  const locationLabel =
    filters.districts.length === 0 ? "All" : String(filters.districts.length);
  const [openSections, setOpenSections] = useState<string[]>(() =>
    openSectionsFor(filters),
  );

  useEffect(() => {
    if (open) setOpenSections(openSectionsFor(filters));
    // Only re-sync when the sheet opens, using filters at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-hidden p-0 sm:max-w-[420px]"
      >
        <SheetHeader className="shrink-0 border-b px-6 py-4 pr-14 text-left">
          <SheetTitle>Filter search</SheetTitle>
          <SheetDescription className="sr-only">
            Narrow listings by price, location, body type, year, and more
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <section className="space-y-3 pb-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Pricing</h3>
              {sectionFilterCount("pricing", filters) > 0 ? (
                <SectionBadge count={sectionFilterCount("pricing", filters)} />
              ) : null}
            </div>
            <Tabs
              value={filters.pricing}
              onValueChange={(value) =>
                onChange({ pricing: value as PricingMode })
              }
            >
              <TabsList className="grid h-11 w-full grid-cols-2">
                <TabsTrigger value="price" className="h-9">
                  Price
                </TabsTrigger>
                <TabsTrigger value="finance" className="h-9">
                  Finance
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {filters.pricing === "finance" ? (
              <MinMaxSelects
                minLabel="Minimum monthly"
                maxLabel="Maximum monthly"
                minValue={filters.minInstalment}
                maxValue={filters.maxInstalment}
                options={INSTALMENT_BANDS}
                openEnded={OPEN_ENDED_INSTALMENT}
                onMinChange={(minInstalment) => onChange({ minInstalment })}
                onMaxChange={(maxInstalment) => onChange({ maxInstalment })}
              />
            ) : (
              <MinMaxSelects
                minLabel="Minimum Price"
                maxLabel="Maximum Price"
                minValue={filters.minPrice}
                maxValue={filters.maxPrice}
                options={PRICE_BANDS}
                openEnded={OPEN_ENDED_PRICE}
                onMinChange={(minPrice) => onChange({ minPrice })}
                onMaxChange={(maxPrice) => onChange({ maxPrice })}
              />
            )}
          </section>

          <Link
            href="/tools/valuation"
            className="mb-2 flex items-center gap-3 rounded-lg bg-muted px-3 py-3 text-sm text-foreground"
          >
            <Car className="h-5 w-5 shrink-0 text-muted-foreground" />
            <span>
              Selling your car?{" "}
              <span className="font-semibold">Get a FREE valuation →</span>
            </span>
          </Link>

          <Accordion
            type="multiple"
            value={openSections}
            onValueChange={setOpenSections}
            className="w-full"
          >
            <AccordionItem value="locations">
              <div className="flex items-center gap-1">
                <AccordionTrigger className="flex-1 hover:no-underline [&>svg]:hidden">
                  <span className="flex items-center gap-2">
                    Locations
                    <SectionBadge count={sectionFilterCount("districts", filters)} />
                  </span>
                </AccordionTrigger>
                <span className="text-sm font-medium text-muted-foreground">
                  {locationLabel}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground"
                  aria-label="Choose districts"
                  onClick={() =>
                    setOpenSections((current) =>
                      current.includes("locations")
                        ? current.filter((item) => item !== "locations")
                        : [...current, "locations"],
                    )
                  }
                >
                  <MapPin />
                </Button>
              </div>
              <AccordionContent>
                <div className="max-h-64 space-y-0.5 overflow-y-auto pr-1">
                  {PICKER_DISTRICTS.map((district) => {
                    const id = `district-${district}`;
                    const checked = filters.districts.includes(district);
                    return (
                      <div key={district} className="flex min-h-11 items-center gap-2">
                        <Checkbox
                          id={id}
                          checked={checked}
                          onCheckedChange={(value) =>
                            onChange({
                              districts:
                                value === true
                                  ? [...filters.districts, district]
                                  : filters.districts.filter((item) => item !== district),
                            })
                          }
                        />
                        <Label htmlFor={id} className="cursor-pointer font-normal">
                          {district}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>

            <FilterAccordion
              value="body"
              title="Body Types"
              count={sectionFilterCount("bodyTypes", filters)}
            >
              <CheckboxList
                items={bodyTypes}
                selected={filters.bodyTypes}
                idPrefix="body"
                onToggle={(value, checked) =>
                  onChange({
                    bodyTypes: checked
                      ? [...filters.bodyTypes, value]
                      : filters.bodyTypes.filter((item) => item !== value),
                  })
                }
              />
            </FilterAccordion>

            <FilterAccordion
              value="years"
              title="Years"
              count={sectionFilterCount("years", filters)}
            >
              <MinMaxSelects
                minLabel="Minimum"
                maxLabel="Maximum"
                minValue={filters.minYear}
                maxValue={filters.maxYear}
                options={YEARS}
                onMinChange={(minYear) => onChange({ minYear })}
                onMaxChange={(maxYear) => onChange({ maxYear })}
              />
            </FilterAccordion>

            <FilterAccordion
              value="mileage"
              title="Mileage"
              count={sectionFilterCount("mileage", filters)}
            >
              <MinMaxSelects
                minLabel="Minimum"
                maxLabel="Maximum"
                minValue={filters.minMileage}
                maxValue={filters.maxMileage}
                options={MILEAGE_BANDS}
                openEnded={OPEN_ENDED_MILEAGE}
                onMinChange={(minMileage) => onChange({ minMileage })}
                onMaxChange={(maxMileage) => onChange({ maxMileage })}
              />
            </FilterAccordion>

            <FilterAccordion
              value="transmission"
              title="Manual / Automatic"
              count={sectionFilterCount("transmission", filters)}
            >
              <ChoiceRadios
                name="transmission"
                value={filters.transmission ?? ANY}
                onChange={(value) =>
                  onChange({
                    transmission:
                      value === ANY
                        ? undefined
                        : (value as ListingFilters["transmission"]),
                  })
                }
                options={[
                  { value: ANY, label: "Any" },
                  { value: "manual", label: "Manual" },
                  { value: "automatic", label: "Automatic" },
                ]}
              />
            </FilterAccordion>

            <FilterAccordion
              value="condition"
              title="New / Used"
              count={sectionFilterCount("condition", filters)}
            >
              <ChoiceRadios
                name="condition"
                value={filters.condition ?? ANY}
                onChange={(value) =>
                  onChange({
                    condition:
                      value === ANY
                        ? undefined
                        : (value as ListingFilters["condition"]),
                  })
                }
                options={[
                  { value: ANY, label: "Any" },
                  { value: "new", label: "New" },
                  { value: "used", label: "Used" },
                ]}
              />
            </FilterAccordion>

            <FilterAccordion
              value="fuel"
              title="Fuel Type"
              count={sectionFilterCount("fuelTypes", filters)}
            >
              <CheckboxList
                items={FUEL_TYPES.map((value) => ({
                  value,
                  label: FUEL_LABELS[value],
                }))}
                selected={filters.fuelTypes}
                idPrefix="fuel"
                onToggle={(value, checked) =>
                  onChange({
                    fuelTypes: checked
                      ? [...filters.fuelTypes, value]
                      : filters.fuelTypes.filter((item) => item !== value),
                  })
                }
              />
            </FilterAccordion>

            <FilterAccordion
              value="drivetrain"
              title="4x2 / 4x4"
              count={sectionFilterCount("drivetrain", filters)}
            >
              <ChoiceRadios
                name="drivetrain"
                value={filters.drivetrain ?? ANY}
                onChange={(value) =>
                  onChange({
                    drivetrain:
                      value === ANY
                        ? undefined
                        : (value as ListingFilters["drivetrain"]),
                  })
                }
                options={[
                  { value: ANY, label: "Any" },
                  ...DRIVETRAINS.map((value) => ({ value, label: value })),
                ]}
              />
            </FilterAccordion>

            <FilterAccordion
              value="colour"
              title="Colour"
              count={sectionFilterCount("colours", filters)}
            >
              <div className="space-y-0.5">
                {COLOURS.map((colour) => {
                  const id = `colour-${colour.value}`;
                  const checked = filters.colours.includes(colour.value);
                  return (
                    <div key={colour.value} className="flex min-h-11 items-center gap-2">
                      <Checkbox
                        id={id}
                        checked={checked}
                        onCheckedChange={(value) =>
                          onChange({
                            colours:
                              value === true
                                ? [...filters.colours, colour.value]
                                : filters.colours.filter((item) => item !== colour.value),
                          })
                        }
                      />
                      <Label
                        htmlFor={id}
                        className="flex cursor-pointer items-center gap-2 font-normal"
                      >
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-border"
                          style={{ backgroundColor: colour.swatch }}
                          aria-hidden
                        />
                        {colour.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </FilterAccordion>

            <FilterAccordion
              value="seller"
              title="Seller Type"
              count={sectionFilterCount("sellerType", filters)}
            >
              <ChoiceRadios
                name="sellerType"
                value={filters.sellerType ?? ANY}
                onChange={(value) =>
                  onChange({
                    sellerType:
                      value === ANY
                        ? undefined
                        : (value as ListingFilters["sellerType"]),
                  })
                }
                options={[
                  { value: ANY, label: "Any" },
                  { value: "dealer", label: "Dealer" },
                  { value: "private", label: "Private" },
                ]}
              />
            </FilterAccordion>

            <FilterAccordion
              value="seats"
              title="Number of Seats"
              count={sectionFilterCount("seats", filters)}
            >
              <CheckboxList
                items={SEAT_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                selected={filters.seats}
                idPrefix="seats"
                onToggle={(value, checked) =>
                  onChange({
                    seats: checked
                      ? [...filters.seats, value]
                      : filters.seats.filter((item) => item !== value),
                  })
                }
              />
            </FilterAccordion>
          </Accordion>
        </div>

        <div className="mt-auto flex shrink-0 items-center justify-between gap-3 border-t bg-background px-6 py-4">
          <Button type="button" variant="ghost" className="px-0" onClick={onReset}>
            Reset all
          </Button>
          <Button type="button" variant="copper" onClick={onApply}>
            {searchActionLabel(resultCount, filters.category)}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SectionBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[0.65rem] font-semibold leading-none text-primary-foreground">
      {count}
    </span>
  );
}

function FilterAccordion({
  value,
  title,
  count,
  children,
}: {
  value: string;
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger className="hover:no-underline">
        <span className="flex items-center gap-2">
          {title}
          <SectionBadge count={count} />
        </span>
      </AccordionTrigger>
      <AccordionContent>{children}</AccordionContent>
    </AccordionItem>
  );
}

function CheckboxList({
  items,
  selected,
  idPrefix,
  onToggle,
}: {
  items: { value: string; label: string }[];
  selected: string[];
  idPrefix: string;
  onToggle: (value: string, checked: boolean) => void;
}) {
  return (
    <div className="space-y-0.5">
      {items.map((item) => {
        const id = `${idPrefix}-${item.value}`;
        return (
          <div key={item.value} className="flex min-h-11 items-center gap-2">
            <Checkbox
              id={id}
              checked={selected.includes(item.value)}
              onCheckedChange={(checked) => onToggle(item.value, checked === true)}
            />
            <Label htmlFor={id} className="cursor-pointer font-normal">
              {item.label}
            </Label>
          </div>
        );
      })}
    </div>
  );
}

function ChoiceRadios({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <RadioGroup value={value} onValueChange={onChange} className="gap-0">
      {options.map((option) => {
        const id = `${name}-${option.value}`;
        return (
          <div key={option.value} className="flex min-h-11 items-center gap-2">
            <RadioGroupItem value={option.value} id={id} />
            <Label htmlFor={id} className="cursor-pointer font-normal">
              {option.label}
            </Label>
          </div>
        );
      })}
    </RadioGroup>
  );
}

function MinMaxSelects({
  minLabel,
  maxLabel,
  minValue,
  maxValue,
  options,
  openEnded,
  onMinChange,
  onMaxChange,
}: {
  minLabel: string;
  maxLabel: string;
  minValue?: number;
  maxValue?: number;
  options: readonly number[];
  openEnded?: number;
  onMinChange: (value: number | undefined) => void;
  onMaxChange: (value: number | undefined) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground">
          {minLabel}
        </Label>
        <Select
          value={minValue != null ? String(minValue) : ANY}
          onValueChange={(value) =>
            onMinChange(value === ANY ? undefined : Number(value))
          }
        >
          <SelectTrigger aria-label={minLabel}>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any</SelectItem>
            {options.map((option) => (
              <SelectItem key={`min-${option}`} value={String(option)}>
                {formatBand(option, openEnded)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground">
          {maxLabel}
        </Label>
        <Select
          value={maxValue != null ? String(maxValue) : ANY}
          onValueChange={(value) =>
            onMaxChange(value === ANY ? undefined : Number(value))
          }
        >
          <SelectTrigger aria-label={maxLabel}>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any</SelectItem>
            {options.map((option) => (
              <SelectItem key={`max-${option}`} value={String(option)}>
                {formatBand(option, openEnded)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
