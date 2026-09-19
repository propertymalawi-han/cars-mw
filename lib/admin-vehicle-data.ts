import type { BodyType, CatalogStatus, FuelType, Prisma } from "@prisma/client";
import { logAdminAction } from "@/lib/adminAudit";
import { restoreExpiredCatalogMutes } from "@/lib/catalog-status";
import { DEFAULT_VEHICLE_CATEGORY } from "@/lib/vehicle-search";
import { revalidateVehicleCatalogCache } from "@/lib/listings-cache";
import { sameName, variantFromTitle } from "@/lib/make-picker";
import { prisma } from "@/lib/prisma";
import { uniqueSlug } from "@/lib/slug";
import { popularMakeRank } from "@/lib/vehicle-makes";
import type { CatalogMuteInput } from "@/lib/validations/admin";

export class CatalogWriteError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export const VEHICLE_DATA_TABS = ["categories", "makes", "models"] as const;
export type VehicleDataTab = (typeof VEHICLE_DATA_TABS)[number];

export type CatalogMuteState = {
  status: CatalogStatus;
  mutedUntil: string | null;
};

export type AdminCategoryRow = CatalogMuteState & {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  sortOrder: number;
  listingCount: number;
  childCount: number;
  children: AdminCategoryRow[];
};

export type AdminMakeOption = {
  id: string;
  name: string;
};

export type AdminMakeRow = CatalogMuteState & {
  id: string;
  name: string;
  slug: string;
  isPopular: boolean;
  sortOrder: number;
  modelCount: number;
  variantCount: number;
  listingCount: number;
};

export type AdminVariantRow = {
  id: string;
  name: string;
  fuelType: FuelType;
  listingCount: number;
};

export type AdminModelRow = CatalogMuteState & {
  id: string;
  makeId: string;
  makeName: string;
  name: string;
  slug: string;
  bodyType: BodyType;
  variantCount: number;
  listingCount: number;
  variants: AdminVariantRow[];
};

export type AdminVehicleCatalog = {
  categories: AdminCategoryRow[];
  makes: AdminMakeRow[];
  makeOptions: AdminMakeOption[];
  selectedMakeId: string | null;
  models: AdminModelRow[];
};

function jsonValue(
  value: Date | string | number | boolean | null | undefined,
): Prisma.InputJsonValue {
  if (value instanceof Date) return value.toISOString();
  return (value ?? null) as Prisma.InputJsonValue;
}

function snapshot(record: Record<string, Date | string | number | boolean | null | undefined>) {
  const out: Record<string, Prisma.InputJsonValue> = {};
  for (const [key, value] of Object.entries(record)) {
    out[key] = jsonValue(value);
  }
  return out;
}

function catalogDiff(
  before: Record<string, Date | string | number | boolean | null | undefined>,
  after: Record<string, Date | string | number | boolean | null | undefined>,
) {
  const diff: Record<string, { from: Prisma.InputJsonValue; to: Prisma.InputJsonValue }> = {};
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
  for (const key of keys) {
    const from = jsonValue(before[key]);
    const to = jsonValue(after[key]);
    if (JSON.stringify(from) !== JSON.stringify(to)) {
      diff[key] = { from, to };
    }
  }
  return diff;
}

function mutedUntilFromInput(mute: CatalogMuteInput, now = new Date()) {
  if (mute.mode === "indefinite") return null;
  const until = new Date(`${mute.until}T23:59:59.999`);
  if (Number.isNaN(until.getTime())) {
    throw new CatalogWriteError("Choose a valid date.");
  }
  if (until.getTime() <= now.getTime()) {
    throw new CatalogWriteError("Choose a future date for a temporary mute.");
  }
  return until;
}

function sameKey(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

async function afterCatalogChange() {
  revalidateVehicleCatalogCache();
}

function listingCountByMake(rows: { make: string; model: string; _count: { _all: number } }[]) {
  const byMake = new Map<string, number>();
  const byMakeModel = new Map<string, number>();
  for (const row of rows) {
    const makeKey = row.make.trim().toLowerCase();
    const modelKey = `${makeKey}::${row.model.trim().toLowerCase()}`;
    byMake.set(makeKey, (byMake.get(makeKey) ?? 0) + row._count._all);
    byMakeModel.set(modelKey, (byMakeModel.get(modelKey) ?? 0) + row._count._all);
  }
  return { byMake, byMakeModel };
}

function categoryListingCount(
  node: { id: string; slug: string },
  childrenOf: Map<string | null, { id: string; slug: string }[]>,
  totalListings: number,
): number {
  const own = node.slug === DEFAULT_VEHICLE_CATEGORY ? totalListings : 0;
  const children = childrenOf.get(node.id) ?? [];
  return (
    own +
    children.reduce(
      (sum, child) => sum + categoryListingCount(child, childrenOf, totalListings),
      0,
    )
  );
}

function nestCategories(
  rows: {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    status: CatalogStatus;
    mutedUntil: Date | null;
    sortOrder: number;
  }[],
  totalListings: number,
): AdminCategoryRow[] {
  const childrenOf = new Map<string | null, typeof rows>();
  for (const row of rows) {
    const list = childrenOf.get(row.parentId) ?? [];
    list.push(row);
    childrenOf.set(row.parentId, list);
  }
  for (const list of Array.from(childrenOf.values())) {
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }

  const slimChildren = new Map<string | null, { id: string; slug: string }[]>();
  for (const [key, list] of Array.from(childrenOf.entries())) {
    slimChildren.set(
      key,
      list.map((row) => ({ id: row.id, slug: row.slug })),
    );
  }

  const mapRow = (row: (typeof rows)[number]): AdminCategoryRow => {
    const children = (childrenOf.get(row.id) ?? []).map(mapRow);
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      parentId: row.parentId,
      status: row.status,
      mutedUntil: row.mutedUntil?.toISOString() ?? null,
      sortOrder: row.sortOrder,
      listingCount: categoryListingCount(row, slimChildren, totalListings),
      childCount: children.length,
      children,
    };
  };

  return (childrenOf.get(null) ?? []).map(mapRow);
}

export function parseVehicleDataTab(value?: string | string[]): VehicleDataTab {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw && VEHICLE_DATA_TABS.includes(raw as VehicleDataTab)) {
    return raw as VehicleDataTab;
  }
  return "categories";
}

export function parseSelectedMakeId(value?: string | string[]) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() || null;
}

export function vehicleDataHref(tab: VehicleDataTab, makeId?: string | null) {
  const params = new URLSearchParams();
  if (tab !== "categories") params.set("tab", tab);
  if (tab === "models" && makeId) params.set("makeId", makeId);
  const query = params.toString();
  return query ? `/admin/vehicle-data?${query}` : "/admin/vehicle-data";
}

export async function getAdminVehicleCatalog(
  selectedMakeId?: string | null,
): Promise<AdminVehicleCatalog> {
  await restoreExpiredCatalogMutes();

  const [categoryRows, makeRows, listingGroups, totalListings] = await Promise.all([
    prisma.vehicleCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.make.findMany({
      include: {
        _count: { select: { models: true } },
        models: { select: { _count: { select: { variants: true } } } },
      },
      orderBy: [{ isPopular: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.listing.groupBy({
      by: ["make", "model"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    prisma.listing.count({ where: { deletedAt: null } }),
  ]);

  const { byMake, byMakeModel } = listingCountByMake(listingGroups);
  const makes: AdminMakeRow[] = makeRows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    isPopular: row.isPopular,
    sortOrder: row.sortOrder,
    status: row.status,
    mutedUntil: row.mutedUntil?.toISOString() ?? null,
    modelCount: row._count.models,
    variantCount: row.models.reduce((sum, model) => sum + model._count.variants, 0),
    listingCount: byMake.get(row.name.toLowerCase()) ?? 0,
  }));

  const makeOptions = makes.map((make) => ({ id: make.id, name: make.name }));
  const resolvedMakeId =
    (selectedMakeId && makes.some((make) => make.id === selectedMakeId)
      ? selectedMakeId
      : makes[0]?.id) ?? null;

  let models: AdminModelRow[] = [];
  if (resolvedMakeId) {
    const selectedMake = makes.find((make) => make.id === resolvedMakeId);
    const modelRows = await prisma.vehicleModel.findMany({
      where: { makeId: resolvedMakeId },
      include: { variants: { orderBy: { name: "asc" } } },
      orderBy: { name: "asc" },
    });
    const listingRows = selectedMake
      ? await prisma.listing.findMany({
          where: {
            deletedAt: null,
            make: { equals: selectedMake.name, mode: "insensitive" },
          },
          select: { make: true, model: true, title: true },
        })
      : [];

    models = modelRows.map((row) => {
      const listingCount = selectedMake
        ? (byMakeModel.get(`${selectedMake.name.toLowerCase()}::${row.name.toLowerCase()}`) ?? 0)
        : 0;
      const modelListings = listingRows.filter((listing) => sameName(listing.model, row.name));
      const variants: AdminVariantRow[] = row.variants.map((variant) => ({
        id: variant.id,
        name: variant.name,
        fuelType: variant.fuelType,
        listingCount: modelListings.filter((listing) => {
          const extracted = variantFromTitle(
            listing.title,
            listing.make,
            listing.model,
          );
          return extracted ? sameName(extracted, variant.name) : false;
        }).length,
      }));
      return {
        id: row.id,
        makeId: row.makeId,
        makeName: selectedMake?.name ?? "",
        name: row.name,
        slug: row.slug,
        bodyType: row.bodyType,
        status: row.status,
        mutedUntil: row.mutedUntil?.toISOString() ?? null,
        variantCount: row.variants.length,
        listingCount,
        variants,
      };
    });
  }

  return {
    categories: nestCategories(categoryRows, totalListings),
    makes,
    makeOptions,
    selectedMakeId: resolvedMakeId,
    models,
  };
}

async function nextCategorySortOrder(parentId: string | null) {
  const siblings = await prisma.vehicleCategory.findMany({
    where: { parentId },
    select: { sortOrder: true },
  });
  return Math.max(0, ...siblings.map((row) => row.sortOrder), 0) + 1;
}

async function assertUniqueCategoryName(name: string, parentId: string | null, excludeId?: string) {
  const siblings = await prisma.vehicleCategory.findMany({
    where: { parentId, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { name: true },
  });
  if (siblings.some((row) => sameKey(row.name, name))) {
    throw new CatalogWriteError("A category with this name already exists here.");
  }
}

async function takenCategorySlugs(excludeId?: string) {
  const rows = await prisma.vehicleCategory.findMany({
    where: excludeId ? { id: { not: excludeId } } : undefined,
    select: { slug: true },
  });
  return rows.map((row) => row.slug);
}

async function categoryDescendantIds(id: string) {
  const rows = await prisma.vehicleCategory.findMany({
    select: { id: true, parentId: true },
  });
  const childrenOf = new Map<string, string[]>();
  for (const row of rows) {
    if (!row.parentId) continue;
    const list = childrenOf.get(row.parentId) ?? [];
    list.push(row.id);
    childrenOf.set(row.parentId, list);
  }
  const found = new Set<string>();
  const stack = [...(childrenOf.get(id) ?? [])];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (found.has(current)) continue;
    found.add(current);
    stack.push(...(childrenOf.get(current) ?? []));
  }
  return found;
}

async function assertParentAllowed(id: string, parentId: string | null) {
  if (!parentId) return;
  if (parentId === id) {
    throw new CatalogWriteError("A category cannot be its own parent.");
  }
  const parent = await prisma.vehicleCategory.findUnique({
    where: { id: parentId },
    select: { id: true },
  });
  if (!parent) throw new CatalogWriteError("Parent category not found.", 404);
  const descendants = await categoryDescendantIds(id);
  if (descendants.has(parentId)) {
    throw new CatalogWriteError("A category cannot be nested under one of its children.");
  }
}

async function categoryListingTotal(id: string) {
  const descendants = await categoryDescendantIds(id);
  descendants.add(id);
  const related = await prisma.vehicleCategory.findMany({
    where: { id: { in: Array.from(descendants) } },
    select: { slug: true },
  });
  if (related.some((row) => row.slug === DEFAULT_VEHICLE_CATEGORY)) {
    return prisma.listing.count({ where: { deletedAt: null } });
  }
  return 0;
}

export async function createCategory(
  adminUserId: string,
  input: { name: string; parentId: string | null; sortOrder?: number },
) {
  await assertUniqueCategoryName(input.name, input.parentId);
  if (input.parentId) {
    const parent = await prisma.vehicleCategory.findUnique({
      where: { id: input.parentId },
      select: { id: true },
    });
    if (!parent) throw new CatalogWriteError("Parent category not found.", 404);
  }
  const slug = uniqueSlug(input.name, await takenCategorySlugs(), "category");
  const sortOrder = input.sortOrder ?? (await nextCategorySortOrder(input.parentId));
  const created = await prisma.vehicleCategory.create({
    data: {
      name: input.name,
      slug,
      parentId: input.parentId,
      sortOrder,
    },
  });
  await logAdminAction({
    adminUserId,
    action: "category.create",
    targetType: "vehicle_category",
    targetId: created.id,
    metadata: {
      after: snapshot({
        name: created.name,
        slug: created.slug,
        parentId: created.parentId,
        sortOrder: created.sortOrder,
        status: created.status,
      }),
    },
  });
  await afterCatalogChange();
  return created;
}

export async function patchCategory(
  adminUserId: string,
  id: string,
  input:
    | { action: "update"; name: string; parentId: string | null; sortOrder?: number }
    | { action: "delete" }
    | { action: "mute"; mute: CatalogMuteInput }
    | { action: "unmute" },
) {
  const existing = await prisma.vehicleCategory.findUnique({ where: { id } });
  if (!existing) throw new CatalogWriteError("Category not found.", 404);

  if (input.action === "delete") {
    const childCount = await prisma.vehicleCategory.count({ where: { parentId: id } });
    if (childCount > 0) {
      throw new CatalogWriteError("Move or delete child categories first.");
    }
    const listingCount = await categoryListingTotal(id);
    if (listingCount > 0) {
      throw new CatalogWriteError(
        "This category still has listings. Mute it instead, or remove those listings from the Listings page first.",
      );
    }
    await prisma.vehicleCategory.delete({ where: { id } });
    await logAdminAction({
      adminUserId,
      action: "category.delete",
      targetType: "vehicle_category",
      targetId: id,
      metadata: {
        before: snapshot({
          name: existing.name,
          slug: existing.slug,
          parentId: existing.parentId,
          sortOrder: existing.sortOrder,
          status: existing.status,
        }),
      },
    });
    await afterCatalogChange();
    return { id };
  }

  if (input.action === "mute") {
    const mutedUntil = mutedUntilFromInput(input.mute);
    const updated = await prisma.vehicleCategory.update({
      where: { id },
      data: { status: "muted", mutedUntil },
    });
    await logAdminAction({
      adminUserId,
      action: "category.mute",
      targetType: "vehicle_category",
      targetId: id,
      metadata: {
        name: existing.name,
        diff: catalogDiff(
          { status: existing.status, mutedUntil: existing.mutedUntil },
          { status: updated.status, mutedUntil: updated.mutedUntil },
        ),
      },
    });
    await afterCatalogChange();
    return updated;
  }

  if (input.action === "unmute") {
    const updated = await prisma.vehicleCategory.update({
      where: { id },
      data: { status: "active", mutedUntil: null },
    });
    await logAdminAction({
      adminUserId,
      action: "category.unmute",
      targetType: "vehicle_category",
      targetId: id,
      metadata: {
        name: existing.name,
        diff: catalogDiff(
          { status: existing.status, mutedUntil: existing.mutedUntil },
          { status: updated.status, mutedUntil: updated.mutedUntil },
        ),
      },
    });
    await afterCatalogChange();
    return updated;
  }

  await assertParentAllowed(id, input.parentId);
  await assertUniqueCategoryName(input.name, input.parentId, id);
  const slug =
    sameKey(input.name, existing.name)
      ? existing.slug
      : uniqueSlug(input.name, await takenCategorySlugs(id), "category");
  const updated = await prisma.vehicleCategory.update({
    where: { id },
    data: {
      name: input.name,
      slug,
      parentId: input.parentId,
      sortOrder: input.sortOrder ?? existing.sortOrder,
    },
  });
  await logAdminAction({
    adminUserId,
    action: "category.update",
    targetType: "vehicle_category",
    targetId: id,
    metadata: {
      diff: catalogDiff(
        {
          name: existing.name,
          slug: existing.slug,
          parentId: existing.parentId,
          sortOrder: existing.sortOrder,
        },
        {
          name: updated.name,
          slug: updated.slug,
          parentId: updated.parentId,
          sortOrder: updated.sortOrder,
        },
      ),
    },
  });
  await afterCatalogChange();
  return updated;
}

async function makeListingCount(name: string) {
  return prisma.listing.count({
    where: { deletedAt: null, make: { equals: name, mode: "insensitive" } },
  });
}

async function modelListingCount(makeName: string, modelName: string) {
  return prisma.listing.count({
    where: {
      deletedAt: null,
      make: { equals: makeName, mode: "insensitive" },
      model: { equals: modelName, mode: "insensitive" },
    },
  });
}

async function nextPopularSortOrder() {
  const popular = await prisma.make.findMany({
    where: { isPopular: true },
    select: { sortOrder: true },
  });
  return Math.max(0, ...popular.map((row) => row.sortOrder), 0) + 1;
}

export async function createMake(
  adminUserId: string,
  input: { name: string; isPopular?: boolean },
) {
  const existing = await prisma.make.findFirst({
    where: { name: { equals: input.name, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) throw new CatalogWriteError("A make with this name already exists.");

  const taken = await prisma.make.findMany({ select: { slug: true } });
  const rank = popularMakeRank(input.name);
  const isPopular = input.isPopular ?? rank != null;
  const created = await prisma.make.create({
    data: {
      name: input.name,
      slug: uniqueSlug(input.name, taken.map((row) => row.slug), "make"),
      isPopular,
      sortOrder: isPopular ? (rank ?? (await nextPopularSortOrder())) : 0,
    },
  });
  await logAdminAction({
    adminUserId,
    action: "make.create",
    targetType: "make",
    targetId: created.id,
    metadata: {
      after: snapshot({
        name: created.name,
        slug: created.slug,
        isPopular: created.isPopular,
        sortOrder: created.sortOrder,
      }),
    },
  });
  await afterCatalogChange();
  return created;
}

export async function patchMake(
  adminUserId: string,
  id: string,
  input:
    | { action: "update"; name?: string; isPopular?: boolean }
    | { action: "delete" }
    | { action: "mute"; mute: CatalogMuteInput }
    | { action: "unmute" },
) {
  const existing = await prisma.make.findUnique({ where: { id } });
  if (!existing) throw new CatalogWriteError("Make not found.", 404);

  if (input.action === "delete") {
    const listingCount = await makeListingCount(existing.name);
    if (listingCount > 0) {
      throw new CatalogWriteError(
        "This make still has listings. Mute it instead, or remove those listings from the Listings page first.",
      );
    }
    await prisma.make.delete({ where: { id } });
    await logAdminAction({
      adminUserId,
      action: "make.delete",
      targetType: "make",
      targetId: id,
      metadata: {
        before: snapshot({
          name: existing.name,
          slug: existing.slug,
          isPopular: existing.isPopular,
          status: existing.status,
        }),
      },
    });
    await afterCatalogChange();
    return { id };
  }

  if (input.action === "mute") {
    const mutedUntil = mutedUntilFromInput(input.mute);
    const updated = await prisma.make.update({
      where: { id },
      data: { status: "muted", mutedUntil },
    });
    await logAdminAction({
      adminUserId,
      action: "make.mute",
      targetType: "make",
      targetId: id,
      metadata: {
        name: existing.name,
        diff: catalogDiff(
          { status: existing.status, mutedUntil: existing.mutedUntil },
          { status: updated.status, mutedUntil: updated.mutedUntil },
        ),
      },
    });
    await afterCatalogChange();
    return updated;
  }

  if (input.action === "unmute") {
    const updated = await prisma.make.update({
      where: { id },
      data: { status: "active", mutedUntil: null },
    });
    await logAdminAction({
      adminUserId,
      action: "make.unmute",
      targetType: "make",
      targetId: id,
      metadata: {
        name: existing.name,
        diff: catalogDiff(
          { status: existing.status, mutedUntil: existing.mutedUntil },
          { status: updated.status, mutedUntil: updated.mutedUntil },
        ),
      },
    });
    await afterCatalogChange();
    return updated;
  }

  const name = input.name?.trim() || existing.name;
  if (!sameKey(name, existing.name)) {
    const clash = await prisma.make.findFirst({
      where: { name: { equals: name, mode: "insensitive" }, id: { not: id } },
      select: { id: true },
    });
    if (clash) throw new CatalogWriteError("A make with this name already exists.");
  }
  const taken = await prisma.make.findMany({
    where: { id: { not: id } },
    select: { slug: true },
  });
  const isPopular = input.isPopular ?? existing.isPopular;
  let sortOrder = existing.sortOrder;
  if (isPopular !== existing.isPopular) {
    sortOrder = isPopular ? await nextPopularSortOrder() : 0;
  }
  const updated = await prisma.make.update({
    where: { id },
    data: {
      name,
      slug: sameKey(name, existing.name)
        ? existing.slug
        : uniqueSlug(name, taken.map((row) => row.slug), "make"),
      isPopular,
      sortOrder,
    },
  });
  await logAdminAction({
    adminUserId,
    action: "make.update",
    targetType: "make",
    targetId: id,
    metadata: {
      diff: catalogDiff(
        {
          name: existing.name,
          slug: existing.slug,
          isPopular: existing.isPopular,
          sortOrder: existing.sortOrder,
        },
        {
          name: updated.name,
          slug: updated.slug,
          isPopular: updated.isPopular,
          sortOrder: updated.sortOrder,
        },
      ),
    },
  });
  await afterCatalogChange();
  return updated;
}

export async function createModel(
  adminUserId: string,
  input: { makeId: string; name: string; bodyType: BodyType },
) {
  const make = await prisma.make.findUnique({
    where: { id: input.makeId },
    select: { id: true, name: true },
  });
  if (!make) throw new CatalogWriteError("Make not found.", 404);
  const clash = await prisma.vehicleModel.findFirst({
    where: { makeId: make.id, name: { equals: input.name, mode: "insensitive" } },
    select: { id: true },
  });
  if (clash) throw new CatalogWriteError("This make already has that model.");
  const taken = await prisma.vehicleModel.findMany({
    where: { makeId: make.id },
    select: { slug: true },
  });
  const created = await prisma.vehicleModel.create({
    data: {
      makeId: make.id,
      name: input.name,
      slug: uniqueSlug(input.name, taken.map((row) => row.slug), "model"),
      bodyType: input.bodyType,
    },
  });
  await logAdminAction({
    adminUserId,
    action: "model.create",
    targetType: "model",
    targetId: created.id,
    metadata: {
      after: snapshot({
        makeId: created.makeId,
        makeName: make.name,
        name: created.name,
        slug: created.slug,
        bodyType: created.bodyType,
      }),
    },
  });
  await afterCatalogChange();
  return created;
}

export async function patchModel(
  adminUserId: string,
  id: string,
  input:
    | { action: "update"; name?: string; bodyType?: BodyType; makeId?: string }
    | { action: "delete" }
    | { action: "mute"; mute: CatalogMuteInput }
    | { action: "unmute" },
) {
  const existing = await prisma.vehicleModel.findUnique({
    where: { id },
    include: { make: { select: { id: true, name: true } } },
  });
  if (!existing) throw new CatalogWriteError("Model not found.", 404);

  if (input.action === "delete") {
    const listingCount = await modelListingCount(existing.make.name, existing.name);
    if (listingCount > 0) {
      throw new CatalogWriteError(
        "This model still has listings. Mute it instead, or remove those listings from the Listings page first.",
      );
    }
    await prisma.vehicleModel.delete({ where: { id } });
    await logAdminAction({
      adminUserId,
      action: "model.delete",
      targetType: "model",
      targetId: id,
      metadata: {
        before: snapshot({
          makeName: existing.make.name,
          name: existing.name,
          slug: existing.slug,
          bodyType: existing.bodyType,
          status: existing.status,
        }),
      },
    });
    await afterCatalogChange();
    return { id };
  }

  if (input.action === "mute") {
    const mutedUntil = mutedUntilFromInput(input.mute);
    const updated = await prisma.vehicleModel.update({
      where: { id },
      data: { status: "muted", mutedUntil },
    });
    await logAdminAction({
      adminUserId,
      action: "model.mute",
      targetType: "model",
      targetId: id,
      metadata: {
        makeName: existing.make.name,
        name: existing.name,
        diff: catalogDiff(
          { status: existing.status, mutedUntil: existing.mutedUntil },
          { status: updated.status, mutedUntil: updated.mutedUntil },
        ),
      },
    });
    await afterCatalogChange();
    return updated;
  }

  if (input.action === "unmute") {
    const updated = await prisma.vehicleModel.update({
      where: { id },
      data: { status: "active", mutedUntil: null },
    });
    await logAdminAction({
      adminUserId,
      action: "model.unmute",
      targetType: "model",
      targetId: id,
      metadata: {
        makeName: existing.make.name,
        name: existing.name,
        diff: catalogDiff(
          { status: existing.status, mutedUntil: existing.mutedUntil },
          { status: updated.status, mutedUntil: updated.mutedUntil },
        ),
      },
    });
    await afterCatalogChange();
    return updated;
  }

  const makeId = input.makeId ?? existing.makeId;
  const make =
    makeId === existing.makeId
      ? existing.make
      : await prisma.make.findUnique({
          where: { id: makeId },
          select: { id: true, name: true },
        });
  if (!make) throw new CatalogWriteError("Make not found.", 404);
  const name = input.name?.trim() || existing.name;
  const clash = await prisma.vehicleModel.findFirst({
    where: {
      makeId: make.id,
      name: { equals: name, mode: "insensitive" },
      id: { not: id },
    },
    select: { id: true },
  });
  if (clash) throw new CatalogWriteError("This make already has that model.");
  const taken = await prisma.vehicleModel.findMany({
    where: { makeId: make.id, id: { not: id } },
    select: { slug: true },
  });
  const updated = await prisma.vehicleModel.update({
    where: { id },
    data: {
      makeId: make.id,
      name,
      slug:
        sameKey(name, existing.name) && make.id === existing.makeId
          ? existing.slug
          : uniqueSlug(name, taken.map((row) => row.slug), "model"),
      bodyType: input.bodyType ?? existing.bodyType,
    },
  });
  await logAdminAction({
    adminUserId,
    action: "model.update",
    targetType: "model",
    targetId: id,
    metadata: {
      diff: catalogDiff(
        {
          makeId: existing.makeId,
          name: existing.name,
          slug: existing.slug,
          bodyType: existing.bodyType,
        },
        {
          makeId: updated.makeId,
          name: updated.name,
          slug: updated.slug,
          bodyType: updated.bodyType,
        },
      ),
    },
  });
  await afterCatalogChange();
  return updated;
}

async function variantListingCount(makeName: string, modelName: string, variantName: string) {
  const listings = await prisma.listing.findMany({
    where: {
      deletedAt: null,
      make: { equals: makeName, mode: "insensitive" },
      model: { equals: modelName, mode: "insensitive" },
    },
    select: { title: true, make: true, model: true },
  });
  return listings.filter((listing) => {
    const extracted = variantFromTitle(listing.title, listing.make, listing.model);
    return extracted ? sameName(extracted, variantName) : false;
  }).length;
}

export async function createVariant(
  adminUserId: string,
  input: { modelId: string; name: string; fuelType?: FuelType },
) {
  const model = await prisma.vehicleModel.findUnique({
    where: { id: input.modelId },
    include: { make: { select: { name: true } } },
  });
  if (!model) throw new CatalogWriteError("Model not found.", 404);
  const clash = await prisma.variant.findFirst({
    where: { modelId: model.id, name: { equals: input.name, mode: "insensitive" } },
    select: { id: true },
  });
  if (clash) throw new CatalogWriteError("This model already has that variant.");
  const created = await prisma.variant.create({
    data: {
      modelId: model.id,
      name: input.name,
      fuelType: input.fuelType ?? "petrol",
    },
  });
  await logAdminAction({
    adminUserId,
    action: "variant.create",
    targetType: "variant",
    targetId: created.id,
    metadata: {
      after: snapshot({
        makeName: model.make.name,
        modelName: model.name,
        name: created.name,
        fuelType: created.fuelType,
      }),
    },
  });
  await afterCatalogChange();
  return created;
}

export async function patchVariant(
  adminUserId: string,
  id: string,
  input: { action: "update"; name?: string; fuelType?: FuelType } | { action: "delete" },
) {
  const existing = await prisma.variant.findUnique({
    where: { id },
    include: {
      model: { include: { make: { select: { name: true } } } },
    },
  });
  if (!existing) throw new CatalogWriteError("Variant not found.", 404);

  if (input.action === "delete") {
    const listingCount = await variantListingCount(
      existing.model.make.name,
      existing.model.name,
      existing.name,
    );
    if (listingCount > 0) {
      throw new CatalogWriteError(
        "This variant still has listings. Remove those listings from the Listings page first.",
      );
    }
    await prisma.variant.delete({ where: { id } });
    await logAdminAction({
      adminUserId,
      action: "variant.delete",
      targetType: "variant",
      targetId: id,
      metadata: {
        before: snapshot({
          makeName: existing.model.make.name,
          modelName: existing.model.name,
          name: existing.name,
          fuelType: existing.fuelType,
        }),
      },
    });
    await afterCatalogChange();
    return { id };
  }

  const name = input.name?.trim() || existing.name;
  if (!sameKey(name, existing.name)) {
    const clash = await prisma.variant.findFirst({
      where: {
        modelId: existing.modelId,
        name: { equals: name, mode: "insensitive" },
        id: { not: id },
      },
      select: { id: true },
    });
    if (clash) throw new CatalogWriteError("This model already has that variant.");
  }
  const updated = await prisma.variant.update({
    where: { id },
    data: {
      name,
      fuelType: input.fuelType ?? existing.fuelType,
    },
  });
  await logAdminAction({
    adminUserId,
    action: "variant.update",
    targetType: "variant",
    targetId: id,
    metadata: {
      makeName: existing.model.make.name,
      modelName: existing.model.name,
      diff: catalogDiff(
        { name: existing.name, fuelType: existing.fuelType },
        { name: updated.name, fuelType: updated.fuelType },
      ),
    },
  });
  await afterCatalogChange();
  return updated;
}
