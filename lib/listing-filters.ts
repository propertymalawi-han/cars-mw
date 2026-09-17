import {
  BODY_TYPES,
  MALAWI_CITIES,
  MALAWI_DISTRICTS,
  type BodyType,
  type MalawiCity,
  type MalawiDistrict,
  type Transmission,
} from "@/types";
import {
  parseModelParam,
  parseVariantParam,
  serializeModelParam,
  serializeVariantParam,
  type MakeModelRef,
  type MakeModelVariantRef,
} from "@/lib/make-picker";
import {
  COLOURS,
  CONDITIONS,
  DEFAULT_VEHICLE_CATEGORY,
  DRIVETRAINS,
  OPEN_ENDED_INSTALMENT,
  OPEN_ENDED_MILEAGE,
  OPEN_ENDED_PRICE,
  SEAT_OPTIONS,
  YEAR_MAX,
  YEAR_MIN,
  isDistrict,
  isFuelType,
  isSellerType,
  isTransmission,
  isVehicleCategory,
  type Drivetrain,
  type PricingMode,
  type VehicleCategory,
  type VehicleColour,
  type VehicleCondition,
} from "@/lib/vehicle-search";

export const LISTINGS_PAGE_SIZE = 24;
export const PRICE_MIN_MWK = 0;
export const PRICE_MAX_MWK = OPEN_ENDED_PRICE;
export const PRICE_STEP_MWK = 500_000;

export type SearchParamValue = string | string[] | undefined;

export type ListingSearchParams = {
  q?: SearchParamValue;
  make?: SearchParamValue;
  model?: SearchParamValue;
  variant?: SearchParamValue;
  category?: SearchParamValue;
  body?: SearchParamValue;
  bodyTypes?: SearchParamValue;
  district?: SearchParamValue;
  districts?: SearchParamValue;
  city?: SearchParamValue;
  minPrice?: SearchParamValue;
  maxPrice?: SearchParamValue;
  minInstalment?: SearchParamValue;
  maxInstalment?: SearchParamValue;
  pricing?: SearchParamValue;
  minYear?: SearchParamValue;
  maxYear?: SearchParamValue;
  minMileage?: SearchParamValue;
  maxMileage?: SearchParamValue;
  transmission?: SearchParamValue;
  condition?: SearchParamValue;
  fuelType?: SearchParamValue;
  drivetrain?: SearchParamValue;
  colours?: SearchParamValue;
  sellerType?: SearchParamValue;
  seats?: SearchParamValue;
  page?: SearchParamValue;
};

export type ListingFilters = {
  category: VehicleCategory;
  q?: string;
  makes: string[];
  models: MakeModelRef[];
  variants: MakeModelVariantRef[];
  bodyTypes: string[];
  districts: MalawiDistrict[];
  minPrice?: number;
  maxPrice?: number;
  minInstalment?: number;
  maxInstalment?: number;
  pricing: PricingMode;
  minYear?: number;
  maxYear?: number;
  minMileage?: number;
  maxMileage?: number;
  transmission?: Transmission;
  condition?: VehicleCondition;
  fuelTypes: string[];
  drivetrain?: Drivetrain;
  colours: VehicleColour[];
  sellerType?: ListingFiltersSellerType;
  seats: string[];
  page: number;
};

type ListingFiltersSellerType = NonNullable<ReturnType<typeof asSellerType>>;

function first(value?: SearchParamValue): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function many(value?: SearchParamValue): string[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value : [value];
  return raw.flatMap((item) => item.split(",")).map((item) => item.trim()).filter(Boolean);
}

export function parsePriceParam(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value.replace(/,/g, "").trim());
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return Math.round(parsed);
}

function parseIntParam(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value.replace(/,/g, "").trim());
  if (!Number.isInteger(parsed)) return undefined;
  return parsed;
}

function asBodyType(value: string): BodyType | undefined {
  return BODY_TYPES.includes(value as BodyType) ? (value as BodyType) : undefined;
}

function asCity(value?: string): MalawiCity | undefined {
  if (!value) return undefined;
  return MALAWI_CITIES.includes(value as MalawiCity) ? (value as MalawiCity) : undefined;
}

function asSellerType(value?: string) {
  if (!value) return undefined;
  return isSellerType(value) ? value : undefined;
}

function asColour(value: string): VehicleColour | undefined {
  return COLOURS.some((colour) => colour.value === value)
    ? (value as VehicleColour)
    : undefined;
}

function asCondition(value?: string): VehicleCondition | undefined {
  if (!value) return undefined;
  return CONDITIONS.includes(value as VehicleCondition)
    ? (value as VehicleCondition)
    : undefined;
}

function asDrivetrain(value?: string): Drivetrain | undefined {
  if (!value) return undefined;
  return DRIVETRAINS.includes(value as Drivetrain) ? (value as Drivetrain) : undefined;
}

function asSeat(value: string): string | undefined {
  return SEAT_OPTIONS.some((option) => option.value === value) ? value : undefined;
}

function asCategory(value?: string): VehicleCategory {
  if (value && isVehicleCategory(value)) return value;
  return DEFAULT_VEHICLE_CATEGORY;
}

function asPricing(value?: string): PricingMode {
  return value === "finance" ? "finance" : "price";
}

function clampRange(
  min: number | undefined,
  max: number | undefined,
  floor: number,
  ceiling: number,
  options?: { clearMinFloor?: boolean; openEndedMax?: number },
): { min?: number; max?: number } {
  const clearMinFloor = options?.clearMinFloor ?? false;
  const openEndedMax = options?.openEndedMax;
  let nextMin = min;
  let nextMax = max;
  if (nextMin != null) nextMin = Math.min(Math.max(nextMin, floor), ceiling);
  if (nextMax != null) nextMax = Math.min(Math.max(nextMax, floor), ceiling);
  if (nextMin != null && nextMax != null && nextMin > nextMax) {
    [nextMin, nextMax] = [nextMax, nextMin];
  }
  if (clearMinFloor && nextMin === floor) nextMin = undefined;
  if (openEndedMax != null && nextMax === openEndedMax) nextMax = undefined;
  return { min: nextMin, max: nextMax };
}

export function defaultListingFilters(): ListingFilters {
  return {
    category: DEFAULT_VEHICLE_CATEGORY,
    makes: [],
    models: [],
    variants: [],
    bodyTypes: [],
    districts: [],
    pricing: "price",
    fuelTypes: [],
    colours: [],
    seats: [],
    page: 1,
  };
}

export function parseListingSearchParams(
  searchParams: ListingSearchParams = {},
): ListingFilters {
  const bodyTypes = Array.from(
    new Set([
      ...many(searchParams.bodyTypes),
      ...many(searchParams.body).map(asBodyType).filter(Boolean),
    ]),
  ) as string[];

  const districts = Array.from(
    new Set(
      [...many(searchParams.districts), ...many(searchParams.district)]
        .map((value) => (isDistrict(value) ? value : undefined))
        .filter(Boolean),
    ),
  ) as MalawiDistrict[];

  const city = asCity(first(searchParams.city)?.trim());
  if (city && MALAWI_DISTRICTS.includes(city as MalawiDistrict)) {
    const asDistrict = city as MalawiDistrict;
    if (!districts.includes(asDistrict)) districts.push(asDistrict);
  }

  const price = clampRange(
    parsePriceParam(first(searchParams.minPrice)),
    parsePriceParam(first(searchParams.maxPrice)),
    PRICE_MIN_MWK,
    PRICE_MAX_MWK,
    { clearMinFloor: true, openEndedMax: OPEN_ENDED_PRICE },
  );
  const instalment = clampRange(
    parsePriceParam(first(searchParams.minInstalment)),
    parsePriceParam(first(searchParams.maxInstalment)),
    0,
    OPEN_ENDED_INSTALMENT,
    { clearMinFloor: true, openEndedMax: OPEN_ENDED_INSTALMENT },
  );
  const year = clampRange(
    parseIntParam(first(searchParams.minYear)),
    parseIntParam(first(searchParams.maxYear)),
    YEAR_MIN,
    YEAR_MAX,
  );
  const mileage = clampRange(
    parseIntParam(first(searchParams.minMileage)),
    parseIntParam(first(searchParams.maxMileage)),
    0,
    OPEN_ENDED_MILEAGE,
    { clearMinFloor: true, openEndedMax: OPEN_ENDED_MILEAGE },
  );

  const pageRaw = Number(first(searchParams.page) ?? "1");
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const q = first(searchParams.q)?.trim() || undefined;
  const makes = Array.from(new Set(many(searchParams.make)));
  const models = many(searchParams.model)
    .map(parseModelParam)
    .filter((item): item is MakeModelRef => Boolean(item));
  const variants = many(searchParams.variant)
    .map(parseVariantParam)
    .filter((item): item is MakeModelVariantRef => Boolean(item));

  const fuelTypes = Array.from(new Set(many(searchParams.fuelType).filter(isFuelType)));
  const colours = Array.from(
    new Set(many(searchParams.colours).map(asColour).filter(Boolean)),
  ) as VehicleColour[];
  const seats = Array.from(new Set(many(searchParams.seats).map(asSeat).filter(Boolean))) as string[];

  return {
    category: asCategory(first(searchParams.category)?.trim()),
    q,
    makes,
    models,
    variants,
    bodyTypes,
    districts,
    minPrice: price.min,
    maxPrice: price.max,
    minInstalment: instalment.min,
    maxInstalment: instalment.max,
    pricing: asPricing(first(searchParams.pricing)?.trim()),
    minYear: year.min,
    maxYear: year.max,
    minMileage: mileage.min,
    maxMileage: mileage.max,
    transmission: isTransmission(first(searchParams.transmission)?.trim() ?? "")
      ? (first(searchParams.transmission)?.trim() as Transmission)
      : undefined,
    condition: asCondition(first(searchParams.condition)?.trim()),
    fuelTypes,
    drivetrain: asDrivetrain(first(searchParams.drivetrain)?.trim()),
    colours,
    sellerType: asSellerType(first(searchParams.sellerType)?.trim()),
    seats,
    page,
  };
}

function setCsv(params: URLSearchParams, key: string, values: string[]) {
  if (values.length > 0) params.set(key, values.join(","));
}

export function listingFiltersToSearchParams(filters: ListingFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.category !== DEFAULT_VEHICLE_CATEGORY) {
    params.set("category", filters.category);
  }
  if (filters.q) params.set("q", filters.q);
  setCsv(params, "make", filters.makes);
  setCsv(params, "model", filters.models.map(serializeModelParam));
  setCsv(params, "variant", filters.variants.map(serializeVariantParam));
  setCsv(params, "bodyTypes", filters.bodyTypes);
  setCsv(params, "districts", filters.districts);
  if (filters.minPrice != null && filters.minPrice > PRICE_MIN_MWK) {
    params.set("minPrice", String(filters.minPrice));
  }
  if (filters.maxPrice != null && filters.maxPrice < PRICE_MAX_MWK) {
    params.set("maxPrice", String(filters.maxPrice));
  }
  if (filters.minInstalment != null) {
    params.set("minInstalment", String(filters.minInstalment));
  }
  if (filters.maxInstalment != null) {
    params.set("maxInstalment", String(filters.maxInstalment));
  }
  if (filters.pricing === "finance") params.set("pricing", "finance");
  if (filters.minYear != null) params.set("minYear", String(filters.minYear));
  if (filters.maxYear != null) params.set("maxYear", String(filters.maxYear));
  if (filters.minMileage != null) params.set("minMileage", String(filters.minMileage));
  if (filters.maxMileage != null) params.set("maxMileage", String(filters.maxMileage));
  if (filters.transmission) params.set("transmission", filters.transmission);
  if (filters.condition) params.set("condition", filters.condition);
  setCsv(params, "fuelType", filters.fuelTypes);
  if (filters.drivetrain) params.set("drivetrain", filters.drivetrain);
  setCsv(params, "colours", filters.colours);
  if (filters.sellerType) params.set("sellerType", filters.sellerType);
  setCsv(params, "seats", filters.seats);
  if (filters.page > 1) params.set("page", String(filters.page));
  return params;
}

export function listingsHref(filters: ListingFilters): string {
  const query = listingFiltersToSearchParams(filters).toString();
  return query ? `/listings?${query}` : "/listings";
}

export function withCategory(
  filters: ListingFilters,
  category: VehicleCategory,
): ListingFilters {
  return {
    ...filters,
    category,
    bodyTypes: [],
    makes: [],
    models: [],
    variants: [],
    q: undefined,
    page: 1,
  };
}

export function resetSidebarFilters(filters: ListingFilters): ListingFilters {
  return {
    ...defaultListingFilters(),
    category: filters.category,
    q: filters.q,
    makes: filters.makes,
    models: filters.models,
    variants: filters.variants,
    page: 1,
  };
}

export function hasActiveFilters(filters: ListingFilters): boolean {
  return (
    activeFilterCount(filters) > 0 ||
    Boolean(filters.q) ||
    filters.makes.length > 0 ||
    filters.models.length > 0 ||
    filters.variants.length > 0 ||
    filters.category !== DEFAULT_VEHICLE_CATEGORY
  );
}

export function activeFilterCount(filters: ListingFilters): number {
  let count = 0;
  if (filters.pricing === "finance") {
    if (filters.minInstalment != null || filters.maxInstalment != null) count += 1;
  } else if (filters.minPrice != null || filters.maxPrice != null) {
    count += 1;
  }
  count += filters.districts.length;
  count += filters.bodyTypes.length;
  if (filters.minYear != null || filters.maxYear != null) count += 1;
  if (filters.minMileage != null || filters.maxMileage != null) count += 1;
  if (filters.transmission) count += 1;
  if (filters.condition) count += 1;
  count += filters.fuelTypes.length;
  if (filters.drivetrain) count += 1;
  count += filters.colours.length;
  if (filters.sellerType) count += 1;
  count += filters.seats.length;
  return count;
}

export function sectionFilterCount(
  section: keyof Pick<
    ListingFilters,
    | "districts"
    | "bodyTypes"
    | "fuelTypes"
    | "colours"
    | "seats"
    | "transmission"
    | "condition"
    | "drivetrain"
    | "sellerType"
  > | "years" | "mileage" | "pricing",
  filters: ListingFilters,
): number {
  switch (section) {
    case "districts":
      return filters.districts.length;
    case "bodyTypes":
      return filters.bodyTypes.length;
    case "fuelTypes":
      return filters.fuelTypes.length;
    case "colours":
      return filters.colours.length;
    case "seats":
      return filters.seats.length;
    case "transmission":
      return filters.transmission ? 1 : 0;
    case "condition":
      return filters.condition ? 1 : 0;
    case "drivetrain":
      return filters.drivetrain ? 1 : 0;
    case "sellerType":
      return filters.sellerType ? 1 : 0;
    case "years":
      return filters.minYear != null || filters.maxYear != null ? 1 : 0;
    case "mileage":
      return filters.minMileage != null || filters.maxMileage != null ? 1 : 0;
    case "pricing":
      if (filters.pricing === "finance") {
        return filters.minInstalment != null || filters.maxInstalment != null ? 1 : 0;
      }
      return filters.minPrice != null || filters.maxPrice != null ? 1 : 0;
    default:
      return 0;
  }
}

export function filtersKey(filters: ListingFilters): string {
  return listingFiltersToSearchParams({ ...filters, page: 1 }).toString();
}

export function facetFiltersKey(filters: ListingFilters): string {
  return listingFiltersToSearchParams({
    ...filters,
    q: undefined,
    makes: [],
    models: [],
    variants: [],
    page: 1,
  }).toString();
}
