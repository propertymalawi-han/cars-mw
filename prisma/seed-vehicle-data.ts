import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  Prisma,
  PrismaClient,
  type BodyType,
  type FuelType,
} from "@prisma/client";
import * as XLSX from "xlsx";
import { slugify } from "../lib/slug";
import { popularMakeRank } from "../lib/vehicle-makes";
import { seedVehicleCategories } from "./seed-categories";

const SHEET_NAME = "Make-Model-Variant";
const DEFAULT_XLSX = resolve(
  process.cwd(),
  "prisma/data/carsmw_vehicle_makes_models_variants.xlsx",
);

type SpreadsheetRow = {
  Make?: string;
  Model?: string;
  Variant?: string;
  "Body Type"?: string;
  "Fuel Type"?: string;
  Notes?: string;
};

function loadEnvFiles() {
  for (const file of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

function cell(value: unknown): string {
  return String(value ?? "").trim();
}

function parseBodyType(value: string): BodyType {
  const primary = value.trim().toLowerCase().split("/")[0]?.trim() ?? "";
  if (primary === "suv" || primary === "crossover") return "suv";
  if (primary === "sedan") return "sedan";
  if (primary === "hatchback") return "hatchback";
  if (primary === "pickup" || primary === "bakkie") return "pickup";
  if (
    primary === "van" ||
    primary === "minivan" ||
    primary === "minibus" ||
    primary === "mpv"
  ) {
    return "van";
  }
  return "other";
}

function parseFuelType(value: string): FuelType {
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("electric") && normalized.includes("hybrid")) return "hybrid";
  if (normalized.includes("electric")) return "electric";
  if (normalized.includes("hybrid")) return "hybrid";
  if (normalized.includes("diesel")) return "diesel";
  return "petrol";
}

function enumSql(value: string, enumName: "BodyType" | "FuelType") {
  return Prisma.raw(`'${value}'::"${enumName}"`);
}

function readRows(filePath: string): SpreadsheetRow[] {
  if (!existsSync(filePath)) {
    throw new Error(`Vehicle spreadsheet not found at ${filePath}`);
  }
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[SHEET_NAME];
  if (!sheet) {
    throw new Error(`Missing "${SHEET_NAME}" sheet in ${filePath}`);
  }
  return XLSX.utils.sheet_to_json<SpreadsheetRow>(sheet, { defval: "" });
}

function countCreatedUpdated(names: string[], existing: Set<string>) {
  let created = 0;
  let updated = 0;
  for (const name of names) {
    if (existing.has(name.toLowerCase())) updated += 1;
    else created += 1;
  }
  return { created, updated };
}

loadEnvFiles();

const prisma = new PrismaClient();

async function main() {
  const filePath = process.env.VEHICLE_DATA_XLSX?.trim() || DEFAULT_XLSX;
  const rows = readRows(filePath);

  const makes = new Map<
    string,
    { name: string; slug: string; isPopular: boolean; sortOrder: number }
  >();
  const models = new Map<
    string,
    { makeName: string; name: string; slug: string; bodyType: BodyType }
  >();
  const variants: {
    makeName: string;
    modelName: string;
    name: string;
    fuelType: FuelType;
    notes: string;
  }[] = [];
  const variantKeys = new Set<string>();

  for (const row of rows) {
    const makeName = cell(row.Make);
    const modelName = cell(row.Model);
    const variantName = cell(row.Variant);
    if (!makeName || !modelName || !variantName) continue;

    const makeKey = makeName.toLowerCase();
    if (!makes.has(makeKey)) {
      const rank = popularMakeRank(makeName);
      makes.set(makeKey, {
        name: makeName,
        slug: slugify(makeName, "make"),
        isPopular: rank != null,
        sortOrder: rank ?? 0,
      });
    }

    const modelKey = `${makeKey}::${modelName.toLowerCase()}`;
    if (!models.has(modelKey)) {
      models.set(modelKey, {
        makeName,
        name: modelName,
        slug: slugify(modelName, "model"),
        bodyType: parseBodyType(cell(row["Body Type"])),
      });
    }

    const variantKey = `${modelKey}::${variantName.toLowerCase()}`;
    if (!variantKeys.has(variantKey)) {
      variantKeys.add(variantKey);
      variants.push({
        makeName,
        modelName,
        name: variantName,
        fuelType: parseFuelType(cell(row["Fuel Type"])),
        notes: cell(row.Notes),
      });
    }
  }

  const makeList = Array.from(makes.values());
  const modelList = Array.from(models.values());

  const [existingMakes, existingModels, existingVariants] = await Promise.all([
    prisma.make.findMany({ select: { name: true } }),
    prisma.vehicleModel.findMany({
      select: { name: true, make: { select: { name: true } } },
    }),
    prisma.variant.findMany({
      select: {
        name: true,
        model: { select: { name: true, make: { select: { name: true } } } },
      },
    }),
  ]);

  const existingMakeNames = new Set(existingMakes.map((row) => row.name.toLowerCase()));
  const existingModelNames = new Set(
    existingModels.map((row) => `${row.make.name.toLowerCase()}::${row.name.toLowerCase()}`),
  );
  const existingVariantNames = new Set(
    existingVariants.map(
      (row) =>
        `${row.model.make.name.toLowerCase()}::${row.model.name.toLowerCase()}::${row.name.toLowerCase()}`,
    ),
  );

  const makeRows = makeList.map(
    (make) =>
      Prisma.sql`(${make.name}, ${make.slug}, ${make.isPopular}, ${make.sortOrder}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
  );
  const upsertedMakes = await prisma.$queryRaw<{ id: string; name: string }[]>`
    INSERT INTO makes (name, slug, is_popular, sort_order, created_at, updated_at)
    VALUES ${Prisma.join(makeRows)}
    ON CONFLICT (name) DO UPDATE SET
      slug = EXCLUDED.slug,
      is_popular = EXCLUDED.is_popular,
      sort_order = EXCLUDED.sort_order,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id, name
  `;
  const makeIds = new Map(
    upsertedMakes.map((row) => [row.name.toLowerCase(), row.id] as const),
  );

  const modelRows = modelList.map((model) => {
    const makeId = makeIds.get(model.makeName.toLowerCase());
    if (!makeId) throw new Error(`Missing make id for ${model.makeName}`);
    return Prisma.sql`(${makeId}::uuid, ${model.name}, ${model.slug}, ${enumSql(model.bodyType, "BodyType")}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;
  });
  const upsertedModels = await prisma.$queryRaw<{ id: string; make_id: string; name: string }[]>`
    INSERT INTO models (make_id, name, slug, body_type, created_at, updated_at)
    VALUES ${Prisma.join(modelRows)}
    ON CONFLICT (make_id, name) DO UPDATE SET
      slug = EXCLUDED.slug,
      body_type = EXCLUDED.body_type,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id, make_id, name
  `;
  const makeIdByUuid = new Map(upsertedMakes.map((row) => [row.id, row.name.toLowerCase()] as const));
  const modelIds = new Map(
    upsertedModels.map((row) => {
      const makeName = makeIdByUuid.get(row.make_id);
      return [`${makeName}::${row.name.toLowerCase()}`, row.id] as const;
    }),
  );

  const variantRows = variants.map((variant) => {
    const modelId = modelIds.get(
      `${variant.makeName.toLowerCase()}::${variant.modelName.toLowerCase()}`,
    );
    if (!modelId) {
      throw new Error(`Missing model id for ${variant.makeName} ${variant.modelName}`);
    }
    return Prisma.sql`(${modelId}::uuid, ${variant.name}, ${enumSql(variant.fuelType, "FuelType")}, ${variant.notes}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;
  });
  await prisma.$executeRaw`
    INSERT INTO variants (model_id, name, fuel_type, notes, created_at, updated_at)
    VALUES ${Prisma.join(variantRows)}
    ON CONFLICT (model_id, name) DO UPDATE SET
      fuel_type = EXCLUDED.fuel_type,
      notes = EXCLUDED.notes,
      updated_at = CURRENT_TIMESTAMP
  `;

  const makeCounts = countCreatedUpdated(
    makeList.map((make) => make.name),
    existingMakeNames,
  );
  const modelCounts = countCreatedUpdated(
    modelList.map((model) => `${model.makeName}::${model.name}`),
    existingModelNames,
  );
  const variantCounts = countCreatedUpdated(
    variants.map(
      (variant) => `${variant.makeName}::${variant.modelName}::${variant.name}`,
    ),
    existingVariantNames,
  );
  const popularCount = await prisma.make.count({ where: { isPopular: true } });
  const categoryCount = await seedVehicleCategories(prisma);

  console.log(
    [
      `Makes: ${makeList.length} (${makeCounts.created} created, ${makeCounts.updated} updated)`,
      `Models: ${modelList.length} (${modelCounts.created} created, ${modelCounts.updated} updated)`,
      `Variants: ${variants.length} (${variantCounts.created} created, ${variantCounts.updated} updated)`,
      `Popular makes flagged: ${popularCount}`,
      `Vehicle categories: ${categoryCount}`,
    ].join("\n"),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
