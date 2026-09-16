import type { BodyType, FuelType, MalawiDistrict, SellerType, Transmission } from "@/types";
import { BODY_TYPES, MALAWI_DISTRICTS } from "@/types";
import { formatNumber } from "@/lib/currency";

export const VEHICLE_CATEGORIES = [
  "cars",
  "bikes",
  "boats",
  "caravans",
  "trucks",
  "buses",
  "trailers",
  "attachments",
] as const;

export type VehicleCategory = (typeof VEHICLE_CATEGORIES)[number];

export const DEFAULT_VEHICLE_CATEGORY: VehicleCategory = "cars";

export const VEHICLE_CATEGORY_LABELS: Record<
  VehicleCategory,
  { singular: string; plural: string }
> = {
  cars: { singular: "car", plural: "cars" },
  bikes: { singular: "bike", plural: "bikes" },
  boats: { singular: "boat", plural: "boats" },
  caravans: { singular: "caravan", plural: "caravans" },
  trucks: { singular: "truck", plural: "trucks" },
  buses: { singular: "bus", plural: "buses" },
  trailers: { singular: "trailer", plural: "trailers" },
  attachments: { singular: "attachment", plural: "attachments" },
};

export type FilterBodyType = {
  value: string;
  label: string;
};

export const CATEGORY_BODY_TYPES: Record<VehicleCategory, FilterBodyType[]> = {
  cars: [
    { value: "sedan", label: "Sedan" },
    { value: "suv", label: "SUV & 4x4" },
    { value: "pickup", label: "Pickup / Bakkie" },
    { value: "hatchback", label: "Hatchback" },
    { value: "van", label: "Minibus" },
    { value: "truck", label: "Truck" },
  ],
  bikes: [
    { value: "scooter", label: "Scooter" },
    { value: "cruiser", label: "Cruiser" },
    { value: "sport", label: "Sport" },
  ],
  boats: [
    { value: "cabin", label: "Cabin" },
    { value: "dinghy", label: "Dinghy" },
    { value: "ski", label: "Ski boat" },
  ],
  caravans: [
    { value: "caravan", label: "Caravan" },
    { value: "motorhome", label: "Motorhome" },
    { value: "trailer-tent", label: "Trailer tent" },
  ],
  trucks: [
    { value: "rigid", label: "Rigid" },
    { value: "tractor-unit", label: "Tractor unit" },
    { value: "tipper", label: "Tipper" },
  ],
  buses: [
    { value: "minibus", label: "Minibus" },
    { value: "coach", label: "Coach" },
    { value: "school", label: "School bus" },
  ],
  trailers: [
    { value: "flatbed", label: "Flatbed" },
    { value: "box", label: "Box trailer" },
    { value: "livestock", label: "Livestock" },
  ],
  attachments: [
    { value: "loader", label: "Loader" },
    { value: "excavator", label: "Excavator" },
    { value: "implement", label: "Implement" },
  ],
};

export const CATEGORY_GROUPS = [
  {
    id: "top",
    label: null,
    items: ["cars", "bikes"] as const,
  },
  {
    id: "leisure",
    label: "Leisure",
    items: ["boats", "caravans"] as const,
  },
  {
    id: "commercial",
    label: "Commercial",
    items: ["trucks", "buses", "trailers", "attachments"] as const,
  },
] as const;

export type CategoryCounts = Record<VehicleCategory, number>;

export function emptyCategoryCounts(): CategoryCounts {
  return {
    cars: 0,
    bikes: 0,
    boats: 0,
    caravans: 0,
    trucks: 0,
    buses: 0,
    trailers: 0,
    attachments: 0,
  };
}

export const PRICE_BANDS = [
  5_000_000, 10_000_000, 15_000_000, 20_000_000, 25_000_000, 30_000_000,
  40_000_000, 50_000_000, 60_000_000, 75_000_000, 100_000_000,
] as const;

export const OPEN_ENDED_PRICE = 100_000_000;

export const INSTALMENT_BANDS = [
  50_000, 100_000, 150_000, 200_000, 300_000, 500_000, 750_000, 1_000_000,
  2_000_000,
] as const;

export const OPEN_ENDED_INSTALMENT = 2_000_000;

export const MILEAGE_BANDS = [
  10_000, 20_000, 30_000, 40_000, 50_000, 75_000, 100_000, 150_000, 200_000,
] as const;

export const OPEN_ENDED_MILEAGE = 200_000;

export const YEAR_MIN = 1990;
export const YEAR_MAX = 2026;

export const COLOURS = [
  { value: "white", label: "White", swatch: "#F4F4F0" },
  { value: "black", label: "Black", swatch: "#1A1A1A" },
  { value: "silver", label: "Silver", swatch: "#C0C4C8" },
  { value: "grey", label: "Grey", swatch: "#6B7280" },
  { value: "blue", label: "Blue", swatch: "#2563EB" },
  { value: "red", label: "Red", swatch: "#B91C1C" },
  { value: "green", label: "Green", swatch: "#15803D" },
] as const;

export type VehicleColour = (typeof COLOURS)[number]["value"];

export const CONDITIONS = ["new", "used"] as const;
export type VehicleCondition = (typeof CONDITIONS)[number];

export const DRIVETRAINS = ["4x2", "4x4"] as const;
export type Drivetrain = (typeof DRIVETRAINS)[number];

export const SEAT_OPTIONS = [
  { value: "2", label: "2" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "7", label: "7" },
  { value: "8", label: "8+" },
] as const;

export const PICKER_DISTRICTS = MALAWI_DISTRICTS;

export function isVehicleCategory(value: string): value is VehicleCategory {
  return VEHICLE_CATEGORIES.includes(value as VehicleCategory);
}

export function isDbBodyType(value: string): value is BodyType {
  return BODY_TYPES.includes(value as BodyType);
}

export function categoryNoun(category: VehicleCategory, count: number): string {
  const labels = VEHICLE_CATEGORY_LABELS[category];
  return count === 1 ? labels.singular : labels.plural;
}

export function categoryDisplayName(category: VehicleCategory): string {
  const { plural } = VEHICLE_CATEGORY_LABELS[category];
  return plural.charAt(0).toUpperCase() + plural.slice(1);
}

export function bodyTypesForCategory(category: VehicleCategory): FilterBodyType[] {
  return CATEGORY_BODY_TYPES[category];
}

export type PricingMode = "price" | "finance";

export function isFuelType(value: string): value is FuelType {
  return value === "petrol" || value === "diesel" || value === "hybrid" || value === "electric";
}

export function isTransmission(value: string): value is Transmission {
  return value === "automatic" || value === "manual";
}

export function isSellerType(value: string): value is SellerType {
  return value === "dealer" || value === "private";
}

export function isDistrict(value: string): value is MalawiDistrict {
  return MALAWI_DISTRICTS.includes(value as MalawiDistrict);
}

export function formatBand(value: number, openEnded?: number): string {
  const formatted = value.toLocaleString("en-MW");
  return openEnded != null && value === openEnded ? `${formatted}+` : formatted;
}

export function searchActionLabel(count: number, category: VehicleCategory): string {
  return `Search ${formatNumber(count)} ${categoryNoun(category, count)}`;
}
