"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  adminListingsHref,
  type AdminListingFilters,
  type AdminListingsHrefContext,
} from "@/lib/admin-listings";
import { LISTING_STATUS_LABEL } from "@/lib/listing-featured";
import {
  VEHICLE_CATEGORIES,
  categoryDisplayName,
} from "@/lib/vehicle-search";
import { LISTING_STATUSES } from "@/types";

const selectTriggerClass = "h-8 md:h-8";

export function AdminListingsFilters({
  filters,
  hrefContext,
}: {
  filters: AdminListingFilters;
  hrefContext?: AdminListingsHrefContext;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(filters.q ?? "");

  useEffect(() => {
    setQuery(filters.q ?? "");
  }, [filters.q]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = query.trim();
      if (next === (filters.q ?? "")) return;
      router.push(
        adminListingsHref(
          {
            ...filters,
            q: next || undefined,
            page: 1,
          },
          hrefContext,
        ),
      );
    }, 400);
    return () => window.clearTimeout(handle);
  }, [filters, hrefContext, query, router]);

  function patch(next: Partial<AdminListingFilters>) {
    router.push(
      adminListingsHref(
        {
          ...filters,
          ...next,
          page: 1,
        },
        hrefContext,
      ),
    );
  }

  const hasFilters = Boolean(
    filters.q ||
      filters.status ||
      filters.sellerType ||
      filters.category ||
      filters.from ||
      filters.to,
  );

  return (
    <div className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-6">
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="admin-listing-search" className="text-xs text-muted-foreground">
          Search
        </Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="admin-listing-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Title or seller"
            className="h-8 pl-8 md:text-sm"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Status</Label>
        <Select
          value={filters.status ?? "all"}
          onValueChange={(value) =>
            patch({ status: value === "all" ? undefined : (value as AdminListingFilters["status"]) })
          }
        >
          <SelectTrigger className={selectTriggerClass} aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {LISTING_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {LISTING_STATUS_LABEL[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Seller type</Label>
        <Select
          value={filters.sellerType ?? "all"}
          onValueChange={(value) =>
            patch({
              sellerType: value === "all" ? undefined : (value as AdminListingFilters["sellerType"]),
            })
          }
        >
          <SelectTrigger className={selectTriggerClass} aria-label="Filter by seller type">
            <SelectValue placeholder="All sellers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sellers</SelectItem>
            <SelectItem value="dealer">Dealer</SelectItem>
            <SelectItem value="private">Individual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Category</Label>
        <Select
          value={filters.category ?? "all"}
          onValueChange={(value) =>
            patch({
              category: value === "all" ? undefined : (value as AdminListingFilters["category"]),
            })
          }
        >
          <SelectTrigger className={selectTriggerClass} aria-label="Filter by category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {VEHICLE_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {categoryDisplayName(category)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="admin-listing-from" className="text-xs text-muted-foreground">
          Posted from
        </Label>
        <Input
          id="admin-listing-from"
          type="date"
          value={filters.from ?? ""}
          onChange={(event) => patch({ from: event.target.value || undefined })}
          className="h-8 md:text-sm"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="admin-listing-to" className="text-xs text-muted-foreground">
          Posted to
        </Label>
        <Input
          id="admin-listing-to"
          type="date"
          value={filters.to ?? ""}
          onChange={(event) => patch({ to: event.target.value || undefined })}
          className="h-8 md:text-sm"
        />
      </div>

      {hasFilters ? (
        <div className="flex items-end sm:col-span-2 xl:col-span-6">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() =>
              router.push(
                adminListingsHref(
                  {
                    sellerId: filters.sellerId,
                    sort: filters.sort,
                    dir: filters.dir,
                    page: 1,
                  },
                  hrefContext,
                ),
              )
            }
          >
            <X className="size-3.5" />
            Clear filters
          </Button>
        </div>
      ) : null}
    </div>
  );
}
