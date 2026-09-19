import type { CatalogStatus } from "@prisma/client";
import { unstable_cache } from "next/cache";
import {
  buildPublicCategoryGroups,
  fallbackPublicCategoryGroups,
  type PublicCategoryGroup,
} from "@/lib/vehicle-categories";
import { LISTING_CACHE_REVALIDATE_SECONDS } from "@/lib/listing-query";
import {
  VEHICLE_CATALOG_CACHE_TAG,
  revalidateVehicleCatalogCache,
} from "@/lib/listings-cache";
import type { MakeFacet } from "@/lib/make-picker";
import { prisma } from "@/lib/prisma";

function expiredMuteWhere(now: Date) {
  return {
    status: "muted" as const,
    mutedUntil: { lte: now },
  };
}

export async function restoreExpiredCatalogMutes(now = new Date()) {
  const where = expiredMuteWhere(now);
  try {
    const [categories, makes, models] = await Promise.all([
      prisma.vehicleCategory.updateMany({
        where,
        data: { status: "active", mutedUntil: null },
      }),
      prisma.make.updateMany({
        where,
        data: { status: "active", mutedUntil: null },
      }),
      prisma.vehicleModel.updateMany({
        where,
        data: { status: "active", mutedUntil: null },
      }),
    ]);
    const restored = categories.count + makes.count + models.count;
    if (restored > 0) revalidateVehicleCatalogCache();
    return restored;
  } catch (error) {
    console.error("Failed to restore expired catalog mutes", error);
    return 0;
  }
}

export function catalogIsActive(
  status: CatalogStatus,
  mutedUntil?: Date | string | null,
  now = new Date(),
) {
  if (status !== "muted") return true;
  if (!mutedUntil) return false;
  return new Date(mutedUntil).getTime() <= now.getTime();
}

export async function mutedCatalogMessage(make: string, model: string) {
  await restoreExpiredCatalogMutes();
  const makeRow = await prisma.make.findFirst({
    where: { name: { equals: make.trim(), mode: "insensitive" } },
    select: { id: true, name: true, status: true, mutedUntil: true },
  });
  if (makeRow && !catalogIsActive(makeRow.status, makeRow.mutedUntil)) {
    return `${makeRow.name} is not available for new listings.`;
  }
  if (!makeRow) return null;

  const modelRow = await prisma.vehicleModel.findFirst({
    where: {
      makeId: makeRow.id,
      name: { equals: model.trim(), mode: "insensitive" },
    },
    select: { name: true, status: true, mutedUntil: true },
  });
  if (modelRow && !catalogIsActive(modelRow.status, modelRow.mutedUntil)) {
    return `${makeRow.name} ${modelRow.name} is not available for new listings.`;
  }
  return null;
}

async function loadPublicCategoryGroups(): Promise<PublicCategoryGroup[]> {
  try {
    const rows = await prisma.vehicleCategory.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        status: true,
        sortOrder: true,
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return buildPublicCategoryGroups(rows);
  } catch (error) {
    console.error("Failed to load public vehicle categories", error);
    return fallbackPublicCategoryGroups();
  }
}

const loadCachedPublicCategoryGroups = unstable_cache(
  loadPublicCategoryGroups,
  ["public-category-groups"],
  { revalidate: LISTING_CACHE_REVALIDATE_SECONDS, tags: [VEHICLE_CATALOG_CACHE_TAG] },
);

export async function getPublicCategoryGroups(): Promise<PublicCategoryGroup[]> {
  await restoreExpiredCatalogMutes();
  return loadCachedPublicCategoryGroups();
}

export function excludeMutedMakeFacets(
  facets: MakeFacet[],
  mutedMakes: Set<string>,
  mutedModels: Set<string>,
): MakeFacet[] {
  return facets
    .filter((facet) => !mutedMakes.has(facet.make.toLowerCase()))
    .map((facet) => ({
      ...facet,
      models: facet.models.filter(
        (model) =>
          !mutedModels.has(`${facet.make.toLowerCase()}::${model.model.toLowerCase()}`),
      ),
    }));
}

export async function loadMutedMakeModelNames() {
  const [makes, models] = await Promise.all([
    prisma.make.findMany({
      where: { status: "muted" },
      select: { name: true, mutedUntil: true, status: true },
    }),
    prisma.vehicleModel.findMany({
      where: { status: "muted" },
      select: {
        name: true,
        mutedUntil: true,
        status: true,
        make: { select: { name: true, status: true, mutedUntil: true } },
      },
    }),
  ]);

  const mutedMakes = new Set(
    makes
      .filter((row) => !catalogIsActive(row.status, row.mutedUntil))
      .map((row) => row.name.toLowerCase()),
  );
  const mutedModels = new Set(
    models
      .filter(
        (row) =>
          !catalogIsActive(row.status, row.mutedUntil) ||
          !catalogIsActive(row.make.status, row.make.mutedUntil),
      )
      .map((row) => `${row.make.name.toLowerCase()}::${row.name.toLowerCase()}`),
  );

  return { mutedMakes, mutedModels };
}
