export type MakeModelRef = {
  make: string;
  model: string;
};

export type MakeModelVariantRef = {
  make: string;
  model: string;
  variant: string;
};

export type MakePickerSelection = {
  makes: string[];
  models: MakeModelRef[];
  variants: MakeModelVariantRef[];
};

export type VariantFacet = {
  variant: string;
  count: number;
};

export type ModelFacet = {
  model: string;
  count: number;
  variants: VariantFacet[];
};

export type MakeFacet = {
  make: string;
  count: number;
  models: ModelFacet[];
};

export type MakePickerChip = {
  key: string;
  label: string;
  remove: MakePickerSelection;
};

export type ListingMakeRow = {
  make: string;
  model: string;
  title: string;
  count?: number;
};

export function emptyMakeSelection(): MakePickerSelection {
  return { makes: [], models: [], variants: [] };
}

export function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function fuzzyMatch(haystack: string, needle: string): boolean {
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase().trim();
  if (!n) return true;
  if (h.includes(n)) return true;
  const compactHaystack = h.replace(/[\s-]/g, "");
  const compactNeedle = n.replace(/[\s-]/g, "");
  return compactHaystack.includes(compactNeedle);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function variantFromTitle(
  title: string,
  make: string,
  model: string,
): string | undefined {
  const yearPrefix = /^\d{4}\s+/.exec(title);
  let rest = yearPrefix ? title.slice(yearPrefix[0].length) : title;
  rest = rest.replace(new RegExp(`^${escapeRegExp(make)}\\s+`, "i"), "");
  rest = rest.replace(new RegExp(`^${escapeRegExp(model)}\\s*`, "i"), "").trim();
  return rest || undefined;
}

function compareName(a: string, b: string): number {
  return a.localeCompare(b, "en", { sensitivity: "base" });
}

export function aggregateMakeFacets(rows: ListingMakeRow[]): MakeFacet[] {
  const makes = new Map<
    string,
    {
      make: string;
      count: number;
      models: Map<
        string,
        {
          model: string;
          count: number;
          variants: Map<string, { variant: string; count: number }>;
        }
      >;
    }
  >();

  for (const row of rows) {
    const makeName = row.make.trim();
    const modelName = row.model.trim();
    if (!makeName || !modelName) continue;
    const n = row.count ?? 1;

    const makeKey = makeName.toLowerCase();
    let make = makes.get(makeKey);
    if (!make) {
      make = { make: makeName, count: 0, models: new Map() };
      makes.set(makeKey, make);
    }
    make.count += n;

    const modelKey = modelName.toLowerCase();
    let model = make.models.get(modelKey);
    if (!model) {
      model = { model: modelName, count: 0, variants: new Map() };
      make.models.set(modelKey, model);
    }
    model.count += n;

    const variant = variantFromTitle(row.title, makeName, modelName);
    if (variant) {
      const variantKey = variant.toLowerCase();
      const current = model.variants.get(variantKey);
      if (current) current.count += n;
      else model.variants.set(variantKey, { variant, count: n });
    }
  }

  return Array.from(makes.values())
    .map((make) => ({
      make: make.make,
      count: make.count,
      models: Array.from(make.models.values())
        .map((model) => ({
          model: model.model,
          count: model.count,
          variants:
            model.variants.size > 1
              ? Array.from(model.variants.values()).sort((a, b) =>
                  compareName(a.variant, b.variant),
                )
              : [],
        }))
        .sort((a, b) => compareName(a.model, b.model)),
    }))
    .sort((a, b) => compareName(a.make, b.make));
}

export function filterMakeFacets(facets: MakeFacet[], query: string): MakeFacet[] {
  const needle = query.trim();
  if (!needle) return facets;
  return facets.filter(
    (make) =>
      fuzzyMatch(make.make, needle) ||
      make.models.some(
        (model) =>
          fuzzyMatch(model.model, needle) ||
          model.variants.some((variant) => fuzzyMatch(variant.variant, needle)),
      ),
  );
}

export function uniqueAutoExpand(facets: MakeFacet[], query: string) {
  if (!query.trim() || facets.length !== 1) {
    return { make: undefined as string | undefined, model: undefined as string | undefined };
  }
  const make = facets[0]!;
  const modelMatches = make.models.filter(
    (model) =>
      fuzzyMatch(model.model, query) ||
      model.variants.some((variant) => fuzzyMatch(variant.variant, query)),
  );
  const makeNameMatches = fuzzyMatch(make.make, query);
  return {
    make: make.make,
    model:
      !makeNameMatches && modelMatches.length === 1 ? modelMatches[0]!.model : undefined,
  };
}

function stripMake(selection: MakePickerSelection, make: string): MakePickerSelection {
  return {
    makes: selection.makes.filter((item) => !sameName(item, make)),
    models: selection.models.filter((item) => !sameName(item.make, make)),
    variants: selection.variants.filter((item) => !sameName(item.make, make)),
  };
}

function putMakeSlice(
  selection: MakePickerSelection,
  facet: MakeFacet,
  slice: { models: MakeModelRef[]; variants: MakeModelVariantRef[] },
): MakePickerSelection {
  const next = stripMake(selection, facet.make);
  const modelFullySelected = (model: ModelFacet) =>
    slice.models.some((item) => sameName(item.model, model.model)) ||
    (model.variants.length > 0 &&
      model.variants.every((variant) =>
        slice.variants.some((item) => sameName(item.variant, variant.variant)),
      ));

  if (facet.models.length > 0 && facet.models.every(modelFullySelected)) {
    return { ...next, makes: [...next.makes, facet.make] };
  }

  return {
    ...next,
    models: [...next.models, ...slice.models],
    variants: [...next.variants, ...slice.variants],
  };
}

function sliceForMake(
  selection: MakePickerSelection,
  facet: MakeFacet,
): { models: MakeModelRef[]; variants: MakeModelVariantRef[] } {
  if (hasMake(selection, facet.make)) {
    return {
      models: facet.models.map((model) => ({ make: facet.make, model: model.model })),
      variants: [],
    };
  }
  return {
    models: selection.models.filter((item) => sameName(item.make, facet.make)),
    variants: selection.variants.filter((item) => sameName(item.make, facet.make)),
  };
}

function hasMake(selection: MakePickerSelection, make: string): boolean {
  return selection.makes.some((item) => sameName(item, make));
}

function hasModel(
  selection: MakePickerSelection,
  make: string,
  model: string,
): boolean {
  return selection.models.some(
    (item) => sameName(item.make, make) && sameName(item.model, model),
  );
}

function hasVariant(
  selection: MakePickerSelection,
  make: string,
  model: string,
  variant: string,
): boolean {
  return selection.variants.some(
    (item) =>
      sameName(item.make, make) &&
      sameName(item.model, model) &&
      sameName(item.variant, variant),
  );
}

function selectedModelCount(selection: MakePickerSelection, facet: MakeFacet): number {
  if (hasMake(selection, facet.make)) return facet.models.length;
  return facet.models.filter((model) =>
    isModelFullySelected(selection, facet, model),
  ).length;
}

function isModelFullySelected(
  selection: MakePickerSelection,
  facet: MakeFacet,
  model: ModelFacet,
): boolean {
  if (hasMake(selection, facet.make) || hasModel(selection, facet.make, model.model)) {
    return true;
  }
  if (model.variants.length === 0) return false;
  return model.variants.every((variant) =>
    hasVariant(selection, facet.make, model.model, variant.variant),
  );
}

function isModelPartiallySelected(
  selection: MakePickerSelection,
  facet: MakeFacet,
  model: ModelFacet,
): boolean {
  if (isModelFullySelected(selection, facet, model)) return false;
  return model.variants.some((variant) =>
    hasVariant(selection, facet.make, model.model, variant.variant),
  );
}

export function makeCheckedState(
  selection: MakePickerSelection,
  facet: MakeFacet,
): boolean | "indeterminate" {
  if (hasMake(selection, facet.make)) return true;
  const selected = selectedModelCount(selection, facet);
  if (selected === 0) {
    const anyVariant = facet.models.some((model) =>
      isModelPartiallySelected(selection, facet, model),
    );
    return anyVariant ? "indeterminate" : false;
  }
  if (selected === facet.models.length && facet.models.length > 0) return true;
  return "indeterminate";
}

export function modelCheckedState(
  selection: MakePickerSelection,
  facet: MakeFacet,
  model: ModelFacet,
): boolean | "indeterminate" {
  if (isModelFullySelected(selection, facet, model)) return true;
  if (isModelPartiallySelected(selection, facet, model)) return "indeterminate";
  return false;
}

export function variantChecked(
  selection: MakePickerSelection,
  facet: MakeFacet,
  model: ModelFacet,
  variant: string,
): boolean {
  if (isModelFullySelected(selection, facet, model)) return true;
  return hasVariant(selection, facet.make, model.model, variant);
}

export function hasMakeSelection(selection: MakePickerSelection): boolean {
  return (
    selection.makes.length > 0 ||
    selection.models.length > 0 ||
    selection.variants.length > 0
  );
}

export function toggleMake(
  selection: MakePickerSelection,
  facet: MakeFacet,
  checked: boolean,
): MakePickerSelection {
  const next = stripMake(selection, facet.make);
  if (!checked) return next;
  return { ...next, makes: [...next.makes, facet.make] };
}

export function toggleModel(
  selection: MakePickerSelection,
  facet: MakeFacet,
  model: ModelFacet,
  checked: boolean,
): MakePickerSelection {
  const slice = sliceForMake(selection, facet);
  const models = slice.models.filter((item) => !sameName(item.model, model.model));
  const variants = slice.variants.filter((item) => !sameName(item.model, model.model));
  if (checked) {
    models.push({ make: facet.make, model: model.model });
  }
  return putMakeSlice(selection, facet, { models, variants });
}

export function toggleVariant(
  selection: MakePickerSelection,
  facet: MakeFacet,
  model: ModelFacet,
  variant: VariantFacet,
  checked: boolean,
): MakePickerSelection {
  const slice = sliceForMake(selection, facet);
  const models = slice.models.filter((item) => !sameName(item.model, model.model));
  const variants = slice.variants.filter(
    (item) =>
      !(sameName(item.model, model.model) && sameName(item.variant, variant.variant)),
  );

  const modelWasFull =
    slice.models.some((item) => sameName(item.model, model.model)) ||
    hasMake(selection, facet.make);

  if (modelWasFull) {
    for (const item of model.variants) {
      if (checked || !sameName(item.variant, variant.variant)) {
        variants.push({
          make: facet.make,
          model: model.model,
          variant: item.variant,
        });
      }
    }
  } else if (checked) {
    variants.push({
      make: facet.make,
      model: model.model,
      variant: variant.variant,
    });
  }

  const selectedVariantCount = variants.filter((item) =>
    sameName(item.model, model.model),
  ).length;
  if (
    model.variants.length > 0 &&
    selectedVariantCount === model.variants.length
  ) {
    return putMakeSlice(selection, facet, {
      models: [...models, { make: facet.make, model: model.model }],
      variants: variants.filter((item) => !sameName(item.model, model.model)),
    });
  }

  return putMakeSlice(selection, facet, { models, variants });
}

export function canonicalizeSelection(
  selection: MakePickerSelection,
  facets: MakeFacet[],
): MakePickerSelection {
  const makeName = (value: string) =>
    facets.find((facet) => sameName(facet.make, value))?.make ?? value;
  const modelName = (make: string, value: string) => {
    const facet = facets.find((item) => sameName(item.make, make));
    return facet?.models.find((item) => sameName(item.model, value))?.model ?? value;
  };
  const variantName = (make: string, model: string, value: string) => {
    const facet = facets.find((item) => sameName(item.make, make));
    const modelFacet = facet?.models.find((item) => sameName(item.model, model));
    return (
      modelFacet?.variants.find((item) => sameName(item.variant, value))?.variant ??
      value
    );
  };

  return {
    makes: selection.makes.map(makeName),
    models: selection.models.map((item) => ({
      make: makeName(item.make),
      model: modelName(item.make, item.model),
    })),
    variants: selection.variants.map((item) => ({
      make: makeName(item.make),
      model: modelName(item.make, item.model),
      variant: variantName(item.make, item.model, item.variant),
    })),
  };
}

export function selectionChips(selection: MakePickerSelection): MakePickerChip[] {
  const chips: MakePickerChip[] = selection.makes.map((make) => ({
    key: `make:${make.toLowerCase()}`,
    label: make,
    remove: {
      makes: selection.makes.filter((item) => !sameName(item, make)),
      models: selection.models,
      variants: selection.variants,
    },
  }));

  for (const model of selection.models) {
    chips.push({
      key: `model:${model.make.toLowerCase()}:${model.model.toLowerCase()}`,
      label: `${model.make}: ${model.model}`,
      remove: {
        makes: selection.makes,
        models: selection.models.filter(
          (item) => !(sameName(item.make, model.make) && sameName(item.model, model.model)),
        ),
        variants: selection.variants,
      },
    });
  }

  for (const variant of selection.variants) {
    chips.push({
      key: `variant:${variant.make.toLowerCase()}:${variant.model.toLowerCase()}:${variant.variant.toLowerCase()}`,
      label: `${variant.make}: ${variant.model} ${variant.variant}`,
      remove: {
        makes: selection.makes,
        models: selection.models,
        variants: selection.variants.filter(
          (item) =>
            !(
              sameName(item.make, variant.make) &&
              sameName(item.model, variant.model) &&
              sameName(item.variant, variant.variant)
            ),
        ),
      },
    });
  }

  return chips;
}

export function selectionSummary(selection: MakePickerSelection): string {
  return selectionChips(selection)
    .map((chip) => chip.label)
    .join(", ");
}

export function parseModelParam(value: string): MakeModelRef | undefined {
  const separator = value.indexOf(":");
  if (separator <= 0) return undefined;
  const make = value.slice(0, separator).trim();
  const model = value.slice(separator + 1).trim();
  if (!make || !model) return undefined;
  return { make, model };
}

export function parseVariantParam(value: string): MakeModelVariantRef | undefined {
  const first = value.indexOf(":");
  if (first <= 0) return undefined;
  const second = value.indexOf(":", first + 1);
  if (second <= first + 1) return undefined;
  const make = value.slice(0, first).trim();
  const model = value.slice(first + 1, second).trim();
  const variant = value.slice(second + 1).trim();
  if (!make || !model || !variant) return undefined;
  return { make, model, variant };
}

export function serializeModelParam(value: MakeModelRef): string {
  return `${value.make}:${value.model}`;
}

export function serializeVariantParam(value: MakeModelVariantRef): string {
  return `${value.make}:${value.model}:${value.variant}`;
}
