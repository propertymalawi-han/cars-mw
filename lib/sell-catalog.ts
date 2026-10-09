import { catalogIsActive } from "@/lib/catalog-status";
import { prisma } from "@/lib/prisma";
import type { BodyType, FuelType } from "@/types";

export type SellCatalogVariant = {
  name: string;
  fuelType: FuelType;
};

export type SellCatalogModel = {
  name: string;
  bodyType: BodyType;
  variants: SellCatalogVariant[];
};

/** Active models and variants keyed by make name. Muted makes and models are omitted. */
export type SellCatalog = Record<string, SellCatalogModel[]>;

export async function getSellCatalog(): Promise<SellCatalog> {
  if (!process.env.DATABASE_URL) return {};

  try {
    const makes = await prisma.make.findMany({
      select: {
        name: true,
        status: true,
        mutedUntil: true,
        models: {
          orderBy: { name: "asc" },
          select: {
            name: true,
            bodyType: true,
            status: true,
            mutedUntil: true,
            variants: {
              orderBy: { name: "asc" },
              select: { name: true, fuelType: true },
            },
          },
        },
      },
    });

    const catalog: SellCatalog = {};
    for (const make of makes) {
      if (!catalogIsActive(make.status, make.mutedUntil)) continue;
      catalog[make.name] = make.models
        .filter((model) => catalogIsActive(model.status, model.mutedUntil))
        .map((model) => ({
          name: model.name,
          bodyType: model.bodyType,
          variants: model.variants.map((variant) => ({
            name: variant.name,
            fuelType: variant.fuelType,
          })),
        }));
    }
    return catalog;
  } catch (error) {
    console.error("Failed to load sell catalog", error);
    return {};
  }
}
