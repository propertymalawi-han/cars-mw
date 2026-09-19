"use client";

import { useState, type ReactNode } from "react";
import {
  Bike,
  Bus,
  Car,
  Caravan,
  Check,
  ChevronDown,
  Container,
  Layers,
  Sailboat,
  Truck,
  Wrench,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatNumber } from "@/lib/currency";
import { cn } from "@/lib/utils";
import {
  fallbackPublicCategoryGroups,
  type PublicCategoryGroup,
} from "@/lib/vehicle-categories";
import {
  categoryDisplayName,
  type CategoryCounts,
  type VehicleCategory,
} from "@/lib/vehicle-search";

const CATEGORY_ICONS: Record<string, ReactNode> = {
  cars: <Car />,
  bikes: <Bike />,
  boats: <Sailboat />,
  caravans: <Caravan />,
  trucks: <Truck />,
  buses: <Bus />,
  trailers: <Container />,
  attachments: <Wrench />,
};

type CategoryPickerProps = {
  value: VehicleCategory;
  counts: CategoryCounts;
  groups?: PublicCategoryGroup[];
  onChange: (category: VehicleCategory) => void;
};

export function CategoryPicker({
  value,
  counts,
  groups = fallbackPublicCategoryGroups(),
  onChange,
}: CategoryPickerProps) {
  const [open, setOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold text-foreground hover:bg-muted"
          aria-label="Vehicle category"
          aria-expanded={open}
        >
          {categoryDisplayName(value)}
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={8}
        avoidCollisions={false}
        className="z-[100] max-h-[min(28rem,70vh)] w-[min(calc(100vw-2rem),18.5rem)] overflow-y-auto border bg-card p-1.5 shadow-md"
      >
        {groups.map((group) => (
          <div key={group.id}>
            {group.label ? (
              <button
                type="button"
                className="flex h-10 w-full items-center justify-between rounded-md px-2 text-sm font-semibold text-foreground"
                onClick={() =>
                  setOpenGroups((current) => ({
                    ...current,
                    [group.id]: current[group.id] === false,
                  }))
                }
              >
                {group.label}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    openGroups[group.id] !== false ? "rotate-180" : "rotate-0",
                  )}
                />
              </button>
            ) : null}
            {(group.label ? openGroups[group.id] !== false : true)
              ? group.items.map((item) => {
                  const selected = item.slug === value;
                  const nested = Boolean(group.label);
                  return (
                    <button
                      key={item.slug}
                      type="button"
                      className={cn(
                        "flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                        nested && "pl-8",
                      )}
                      onClick={() => {
                        onChange(item.slug);
                        setOpen(false);
                      }}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        {selected ? (
                          <Check className="h-4 w-4 shrink-0 text-foreground" />
                        ) : nested ? (
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground">
                            {CATEGORY_ICONS[item.slug] ?? <Layers />}
                          </span>
                        ) : (
                          <span className="w-4 shrink-0" />
                        )}
                        <span className="truncate font-medium">{item.name}</span>
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[0.7rem] font-semibold tabular-nums text-primary">
                        {formatNumber(counts[item.slug] ?? 0)}
                      </span>
                    </button>
                  );
                })
              : null}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}
