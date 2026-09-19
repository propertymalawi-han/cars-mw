"use client";

import { useEffect, useId, useMemo, type KeyboardEvent } from "react";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { formatNumber } from "@/lib/currency";
import { partitionPopularMakes } from "@/lib/vehicle-makes";
import {
  emptyMakeSelection,
  filterMakeFacets,
  hasMakeSelection,
  makeCheckedState,
  modelCheckedState,
  selectionChips,
  selectionSummary,
  toggleMake,
  toggleModel,
  toggleVariant,
  uniqueAutoExpand,
  variantChecked,
  type MakeFacet,
  type MakePickerSelection,
  type ModelFacet,
} from "@/lib/make-picker";
import { cn } from "@/lib/utils";

const CHECKBOX_CLASS =
  "border-copper shadow-none data-[state=checked]:border-copper data-[state=checked]:bg-copper data-[state=checked]:text-copper-foreground data-[state=indeterminate]:border-copper data-[state=indeterminate]:bg-copper data-[state=indeterminate]:text-copper-foreground";

type MakePickerInputProps = {
  query: string;
  onQueryChange: (query: string) => void;
  selection: MakePickerSelection;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClear: () => void;
};

export function MakePickerInput({
  query,
  onQueryChange,
  selection,
  open,
  onOpenChange,
  onClear,
}: MakePickerInputProps) {
  const summary = selectionSummary(selection);
  const showSummary = !open && !query && Boolean(summary);
  const showClear = Boolean(query) || hasMakeSelection(selection);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onOpenChange(false);
    }
  }

  return (
    <div className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={open || query ? query : ""}
        onChange={(event) => {
          onQueryChange(event.target.value);
          if (!open) onOpenChange(true);
        }}
        onFocus={() => onOpenChange(true)}
        onClick={() => onOpenChange(true)}
        onKeyDown={handleKeyDown}
        placeholder={showSummary ? undefined : "Enter Make, Model and Variant"}
        aria-label="Enter Make, Model and Variant"
        aria-expanded={open}
        aria-haspopup="listbox"
        autoComplete="off"
        className={cn(
          "h-11 border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0",
          showClear ? "pr-9" : "pr-3",
          showSummary && "placeholder:text-transparent",
        )}
      />
      {showSummary ? (
        <span className="pointer-events-none absolute inset-y-0 left-9 right-9 flex items-center truncate text-sm text-foreground">
          {summary}
        </span>
      ) : null}
      {showClear ? (
        <button
          type="button"
          aria-label="Clear make and model"
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={onClear}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

type MakePickerChipsProps = {
  selection: MakePickerSelection;
  onSelectionChange: (selection: MakePickerSelection) => void;
};

export function MakePickerChips({
  selection,
  onSelectionChange,
}: MakePickerChipsProps) {
  const chips = selectionChips(selection);
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 px-2 pb-2 pt-1">
      {chips.map((chip) => (
        <Badge
          key={chip.key}
          variant="outline"
          className="h-7 gap-1 border-border bg-background pr-1 font-medium text-foreground"
        >
          {chip.label}
          <button
            type="button"
            aria-label={`Remove ${chip.label}`}
            className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => onSelectionChange(chip.remove)}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}

type MakePickerPanelProps = {
  query: string;
  selection: MakePickerSelection;
  onSelectionChange: (selection: MakePickerSelection) => void;
  facets: MakeFacet[];
  expandedMake?: string;
  expandedModel?: string;
  onExpandedMakeChange: (make?: string) => void;
  onExpandedModelChange: (model?: string) => void;
};

export function MakePickerPanel({
  query,
  selection,
  onSelectionChange,
  facets,
  expandedMake,
  expandedModel,
  onExpandedMakeChange,
  onExpandedModelChange,
}: MakePickerPanelProps) {
  const visible = useMemo(() => filterMakeFacets(facets, query), [facets, query]);
  const sections = useMemo(() => {
    const { popular, rest } = partitionPopularMakes(visible);
    if (popular.length > 0 && rest.length > 0) {
      return [
        { key: "popular", items: popular },
        { key: "all", items: rest, heading: "All makes" },
      ];
    }
    return [{ key: "makes", items: visible }];
  }, [visible]);
  const anyId = useId();
  const anyChecked = !hasMakeSelection(selection);

  useEffect(() => {
    const next = uniqueAutoExpand(visible, query);
    if (next.make) {
      onExpandedMakeChange(next.make);
      onExpandedModelChange(next.model);
    }
  }, [visible, query, onExpandedMakeChange, onExpandedModelChange]);

  return (
    <div
      role="listbox"
      aria-label="Makes and models"
      aria-multiselectable="true"
      className="overflow-hidden rounded-lg border bg-card shadow-md"
    >
      <div className="picker-scroll max-h-[min(340px,50vh)] py-1">
        <PickerRow>
          <Checkbox
            id={anyId}
            checked={anyChecked}
            className={CHECKBOX_CLASS}
            onCheckedChange={() => onSelectionChange(emptyMakeSelection())}
          />
          <label htmlFor={anyId} className="min-w-0 flex-1 cursor-pointer text-sm font-medium">
            Any
          </label>
        </PickerRow>

        {visible.length === 0 ? (
          <p className="px-3 py-3 text-sm text-muted-foreground">No matching makes</p>
        ) : (
          sections.map((section) => (
            <div key={section.key}>
              {section.heading ? (
                <div className="mt-1 border-t border-border px-3 pb-1 pt-2 text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  {section.heading}
                </div>
              ) : null}
              {section.items.map((facet) => {
                const makeOpen = Boolean(
                  expandedMake &&
                    facet.make.toLowerCase() === expandedMake.toLowerCase(),
                );
                return (
                  <MakeRow
                    key={facet.make}
                    facet={facet}
                    selection={selection}
                    expanded={makeOpen}
                    expandedModel={makeOpen ? expandedModel : undefined}
                    onToggleMake={(checked) =>
                      onSelectionChange(toggleMake(selection, facet, checked))
                    }
                    onToggleModels={() => {
                      onExpandedMakeChange(makeOpen ? undefined : facet.make);
                      onExpandedModelChange(undefined);
                    }}
                    onToggleModel={(model, checked) =>
                      onSelectionChange(toggleModel(selection, facet, model, checked))
                    }
                    onToggleVariants={(model) =>
                      onExpandedModelChange(
                        expandedModel &&
                          model.model.toLowerCase() === expandedModel.toLowerCase()
                          ? undefined
                          : model.model,
                      )
                    }
                    onToggleVariant={(model, variant, checked) =>
                      onSelectionChange(
                        toggleVariant(selection, facet, model, variant, checked),
                      )
                    }
                  />
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MakeRow({
  facet,
  selection,
  expanded,
  expandedModel,
  onToggleMake,
  onToggleModels,
  onToggleModel,
  onToggleVariants,
  onToggleVariant,
}: {
  facet: MakeFacet;
  selection: MakePickerSelection;
  expanded: boolean;
  expandedModel?: string;
  onToggleMake: (checked: boolean) => void;
  onToggleModels: () => void;
  onToggleModel: (model: ModelFacet, checked: boolean) => void;
  onToggleVariants: (model: ModelFacet) => void;
  onToggleVariant: (
    model: ModelFacet,
    variant: ModelFacet["variants"][number],
    checked: boolean,
  ) => void;
}) {
  const id = `make-${facet.make.replace(/\s+/g, "-").toLowerCase()}`;
  const checked = makeCheckedState(selection, facet);

  return (
    <div>
      <PickerRow>
        <Checkbox
          id={id}
          checked={checked}
          className={CHECKBOX_CLASS}
          onCheckedChange={(value) => onToggleMake(value === true)}
        />
        <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer truncate text-sm">
          {facet.make}
        </label>
        <CountBadge count={facet.count} />
        {facet.models.length > 0 ? (
          <ExpandLink
            label="Models"
            expanded={expanded}
            onClick={onToggleModels}
          />
        ) : null}
      </PickerRow>

      {expanded
        ? facet.models.map((model) => {
            const modelOpen = Boolean(
              expandedModel &&
                model.model.toLowerCase() === expandedModel.toLowerCase(),
            );
            return (
              <ModelRow
                key={model.model}
                makeId={id}
                facet={facet}
                model={model}
                selection={selection}
                expanded={modelOpen}
                onToggle={(checked) => onToggleModel(model, checked)}
                onToggleVariants={() => onToggleVariants(model)}
                onToggleVariant={(variant, checked) =>
                  onToggleVariant(model, variant, checked)
                }
              />
            );
          })
        : null}
    </div>
  );
}

function ModelRow({
  makeId,
  facet,
  model,
  selection,
  expanded,
  onToggle,
  onToggleVariants,
  onToggleVariant,
}: {
  makeId: string;
  facet: MakeFacet;
  model: ModelFacet;
  selection: MakePickerSelection;
  expanded: boolean;
  onToggle: (checked: boolean) => void;
  onToggleVariants: () => void;
  onToggleVariant: (
    variant: ModelFacet["variants"][number],
    checked: boolean,
  ) => void;
}) {
  const id = `${makeId}-${model.model.replace(/\s+/g, "-").toLowerCase()}`;
  const checked = modelCheckedState(selection, facet, model);

  return (
    <div>
      <PickerRow className="pl-8">
        <Checkbox
          id={id}
          checked={checked}
          className={CHECKBOX_CLASS}
          onCheckedChange={(value) => onToggle(value === true)}
        />
        <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer truncate text-sm">
          {model.model}
        </label>
        <CountBadge count={model.count} />
        {model.variants.length > 1 ? (
          <ExpandLink
            label="Variants"
            expanded={expanded}
            onClick={onToggleVariants}
          />
        ) : null}
      </PickerRow>
      {expanded
        ? model.variants.map((variant) => {
            const variantId = `${id}-${variant.variant.replace(/\s+/g, "-").toLowerCase()}`;
            return (
              <PickerRow key={variant.variant} className="pl-14">
                <Checkbox
                  id={variantId}
                  checked={variantChecked(selection, facet, model, variant.variant)}
                  className={CHECKBOX_CLASS}
                  onCheckedChange={(value) => onToggleVariant(variant, value === true)}
                />
                <label
                  htmlFor={variantId}
                  className="min-w-0 flex-1 cursor-pointer truncate text-sm"
                >
                  {variant.variant}
                </label>
                <CountBadge count={variant.count} />
              </PickerRow>
            );
          })
        : null}
    </div>
  );
}

function PickerRow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-h-11 items-center gap-2 px-3 hover:bg-muted/70", className)}>
      {children}
    </div>
  );
}

function CountBadge({ count }: { count: number }) {
  return (
    <Badge
      variant="copper"
      className="h-5 shrink-0 px-1.5 text-[0.65rem] font-semibold tabular-nums leading-none"
    >
      {formatNumber(count)}
    </Badge>
  );
}

function ExpandLink({
  label,
  expanded,
  onClick,
}: {
  label: string;
  expanded: boolean;
  onClick: () => void;
}) {
  const Icon = expanded ? ChevronUp : ChevronDown;
  return (
    <button
      type="button"
      className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
      aria-expanded={expanded}
      onClick={onClick}
    >
      {label}
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
