"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { startRouteNavigation, subscribeRouteLoading } from "@/lib/route-loading";
import { SlidersHorizontal } from "lucide-react";
import { CategoryPicker } from "@/components/search/category-picker";
import { FilterSidebar } from "@/components/search/filter-sidebar";
import {
  MakePickerChips,
  MakePickerInput,
  MakePickerPanel,
} from "@/components/search/make-picker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  activeFilterCount,
  defaultListingFilters,
  facetFiltersKey,
  filtersKey,
  listingsHref,
  resetSidebarFilters,
  withCategory,
  type ListingFilters,
} from "@/lib/listing-filters";
import {
  emptyMakeSelection,
  filterMakeFacets,
  hasMakeSelection,
  type MakeFacet,
  type MakePickerSelection,
} from "@/lib/make-picker";
import {
  searchActionLabel,
  type CategoryCounts,
  type VehicleCategory,
} from "@/lib/vehicle-search";
import type { PublicCategoryGroup } from "@/lib/vehicle-categories";

const FILTER_COUNT_DEBOUNCE_MS = 300;

type VehicleSearchBarProps = {
  filters?: ListingFilters;
  categoryCounts: CategoryCounts;
  resultCount: number;
  makeFacets: MakeFacet[];
  categoryGroups?: PublicCategoryGroup[];
  className?: string;
};

export function VehicleSearchBar({
  filters,
  categoryCounts,
  resultCount,
  makeFacets,
  categoryGroups,
  className,
}: VehicleSearchBarProps) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const initial = filters ?? defaultListingFilters();
  const [draft, setDraft] = useState<ListingFilters>(initial);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [expandedMake, setExpandedMake] = useState<string>();
  const [expandedModel, setExpandedModel] = useState<string>();
  const [liveCount, setLiveCount] = useState(resultCount);
  const [facets, setFacets] = useState<MakeFacet[]>(makeFacets);
  const skipCountFetch = useRef(true);
  const skipFacetFetch = useRef(true);
  const searchLock = useRef(false);
  const [navPending, setNavPending] = useState(false);
  const initialKey = filtersKey(initial);
  const draftKey = filtersKey(draft);
  const facetKey = facetFiltersKey(draft);
  const selection: MakePickerSelection = {
    makes: draft.makes,
    models: draft.models,
    variants: draft.variants,
  };

  useEffect(() => subscribeRouteLoading((next) => {
    setNavPending(next);
    if (!next) searchLock.current = false;
  }), []);

  useEffect(() => {
    setDraft(initial);
    setLiveCount(resultCount);
    setFacets(makeFacets);
    setQuery("");
    skipCountFetch.current = true;
    skipFacetFetch.current = true;
    // Sync from the URL/server snapshot, not object identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey, resultCount]);

  useEffect(() => {
    if (skipCountFetch.current) {
      skipCountFetch.current = false;
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/listings/count?${draftKey}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const payload = (await response.json()) as { total?: number };
        if (typeof payload.total === "number") setLiveCount(payload.total);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }, FILTER_COUNT_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [draftKey]);

  useEffect(() => {
    if (skipFacetFetch.current) {
      skipFacetFetch.current = false;
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/listings/makes?${facetKey}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const payload = (await response.json()) as { makes?: MakeFacet[] };
        if (Array.isArray(payload.makes)) setFacets(payload.makes);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }, FILTER_COUNT_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [facetKey]);

  useEffect(() => {
    if (!pickerOpen) return;

    function onPointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      setPickerOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setPickerOpen(false);
    }

    const timer = window.setTimeout(() => {
      document.addEventListener("pointerdown", onPointerDown);
      document.addEventListener("keydown", onKeyDown);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [pickerOpen]);

  function patchDraft(next: Partial<ListingFilters>) {
    setDraft((current) => ({ ...current, ...next, page: 1 }));
  }

  function patchSelection(next: MakePickerSelection) {
    patchDraft({ ...next, q: undefined });
  }

  function closePicker() {
    setPickerOpen(false);
    setQuery("");
  }

  function applySearch(next: ListingFilters = draft) {
    if (navPending || searchLock.current) return;
    closePicker();
    setSheetOpen(false);
    const href = listingsHref({ ...next, q: undefined, page: 1 });
    searchLock.current = true;
    startRouteNavigation(href);
    router.push(href);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let next: ListingFilters = { ...draft, q: undefined, page: 1 };
    if (query.trim() && !hasMakeSelection(next)) {
      const matches = filterMakeFacets(facets, query);
      if (matches.length === 1) {
        next = { ...next, ...emptyMakeSelection(), makes: [matches[0]!.make] };
      }
    }
    applySearch(next);
  }

  function handleClear() {
    setQuery("");
    setPickerOpen(false);
    setExpandedMake(undefined);
    setExpandedModel(undefined);
    patchSelection(emptyMakeSelection());
  }

  const filterCount = activeFilterCount(draft);

  return (
    <>
      <div ref={rootRef} className="relative">
        <Card className={className ?? "mt-8 p-2 shadow-md sm:mt-10 sm:p-2.5"}>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-0"
          >
            <div className="flex min-w-0 flex-1 items-stretch">
              <CategoryPicker
                value={draft.category}
                counts={categoryCounts}
                groups={categoryGroups}
                onChange={(category: VehicleCategory) => {
                  setExpandedMake(undefined);
                  setExpandedModel(undefined);
                  setDraft((current) => withCategory(current, category));
                }}
              />
              <div
                className="mx-1 hidden w-px self-center bg-border xs:block"
                style={{ height: "1.75rem" }}
                aria-hidden
              />
              <MakePickerInput
                query={query}
                onQueryChange={setQuery}
                selection={selection}
                open={pickerOpen}
                onOpenChange={setPickerOpen}
                onClear={handleClear}
              />
            </div>

            <div className="flex items-center gap-1 sm:shrink-0">
              <Button
                type="button"
                variant="ghost"
                className="h-11 shrink-0 px-3 text-foreground"
                onClick={() => {
                  closePicker();
                  setSheetOpen(true);
                }}
              >
                <SlidersHorizontal />
                Filters
                {filterCount > 0 ? (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-[0.65rem] font-semibold leading-none text-primary-foreground">
                    {filterCount}
                  </span>
                ) : null}
              </Button>
              <Button
                type="submit"
                variant="copper"
                size="lg"
                disabled={navPending}
                className="h-11 min-w-0 flex-1 rounded-full sm:min-w-[11.5rem] sm:flex-none"
              >
                {searchActionLabel(liveCount, draft.category)}
              </Button>
            </div>
          </form>
          {!pickerOpen ? (
            <MakePickerChips selection={selection} onSelectionChange={patchSelection} />
          ) : null}
        </Card>

        {pickerOpen ? (
          <div className="absolute inset-x-0 top-full z-[80] mt-1.5">
            <MakePickerPanel
              query={query}
              selection={selection}
              onSelectionChange={patchSelection}
              facets={facets}
              expandedMake={expandedMake}
              expandedModel={expandedModel}
              onExpandedMakeChange={setExpandedMake}
              onExpandedModelChange={setExpandedModel}
            />
          </div>
        ) : null}
      </div>

      <FilterSidebar
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        filters={draft}
        onChange={patchDraft}
        resultCount={liveCount}
        onApply={() => applySearch()}
        onReset={() => setDraft((current) => resetSidebarFilters(current))}
      />
    </>
  );
}
