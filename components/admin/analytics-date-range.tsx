"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format, subDays, subMonths } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  adminAnalyticsHref,
  type AdminAnalyticsFilters,
} from "@/lib/admin-analytics";
import { cn } from "@/lib/utils";

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

const PRESETS = [
  { id: "7d", label: "7 days", from: () => subDays(new Date(), 6) },
  { id: "30d", label: "30 days", from: () => subDays(new Date(), 29) },
  { id: "90d", label: "90 days", from: () => subDays(new Date(), 89) },
  { id: "12m", label: "12 months", from: () => subMonths(new Date(), 12) },
] as const;

export function AnalyticsDateRangePicker({
  filters,
}: {
  filters: AdminAnalyticsFilters;
}) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const selected = useMemo<DateRange>(
    () => ({
      from: parseIsoDate(filters.from),
      to: parseIsoDate(filters.to),
    }),
    [filters.from, filters.to],
  );
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>(selected);

  function applyRange(from: Date, to: Date) {
    const start = from <= to ? from : to;
    const end = from <= to ? to : from;
    router.push(
      adminAnalyticsHref({
        ...filters,
        from: format(start, "yyyy-MM-dd"),
        to: format(end, "yyyy-MM-dd"),
      }),
    );
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft(selected);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-8 justify-start px-2.5 font-normal", !selected && "text-muted-foreground")}
        >
          <CalendarIcon className="size-3.5" />
          <span className="tabular-nums">
            {format(selected.from!, "d MMM yyyy")} – {format(selected.to!, "d MMM yyyy")}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0">
        <div className="flex flex-wrap gap-1 border-b p-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset.id}
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => applyRange(preset.from(), new Date())}
            >
              {preset.label}
            </Button>
          ))}
        </div>
        <Calendar
          mode="range"
          defaultMonth={draft?.from ?? selected.from}
          selected={draft}
          onSelect={(range) => {
            setDraft(range);
            if (range?.from && range.to) {
              applyRange(range.from, range.to);
            }
          }}
          numberOfMonths={isMobile ? 1 : 2}
          disabled={{ after: new Date() }}
        />
      </PopoverContent>
    </Popover>
  );
}
