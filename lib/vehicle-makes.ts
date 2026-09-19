export const POPULAR_MAKES = [
  "Toyota",
  "Nissan",
  "Honda",
  "Mazda",
  "Mitsubishi",
  "Suzuki",
  "Subaru",
  "Isuzu",
  "Hyundai",
  "Kia",
  "Ford",
  "Volkswagen",
  "Mercedes-Benz",
  "BMW",
] as const;

export type VehicleMakeOption = {
  name: string;
  slug: string;
  isPopular: boolean;
  sortOrder: number;
};

export function popularMakeRank(name: string): number | undefined {
  const index = POPULAR_MAKES.findIndex(
    (make) => make.toLowerCase() === name.trim().toLowerCase(),
  );
  return index === -1 ? undefined : index + 1;
}

export function compareVehicleMakes(
  a: Pick<VehicleMakeOption, "name" | "isPopular" | "sortOrder">,
  b: Pick<VehicleMakeOption, "name" | "isPopular" | "sortOrder">,
): number {
  if (a.isPopular !== b.isPopular) return a.isPopular ? -1 : 1;
  if (a.isPopular && a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
}

export function partitionPopularMakes<T extends { isPopular: boolean }>(items: T[]): {
  popular: T[];
  rest: T[];
} {
  const popular: T[] = [];
  const rest: T[] = [];
  for (const item of items) {
    if (item.isPopular) popular.push(item);
    else rest.push(item);
  }
  return { popular, rest };
}
