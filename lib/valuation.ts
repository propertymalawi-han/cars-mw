/**
 * Seed base prices are approximate new / duty-paid Malawi market values in MWK.
 * Estimates depreciate from these with a simple age + mileage formula — not
 * an appraisal.
 */
export const BASE_PRICES: Record<string, Record<string, number>> = {
  Toyota: {
    Hilux: 55_000_000,
    "Land Cruiser Prado": 85_000_000,
    "Land Cruiser 70": 70_000_000,
    Fortuner: 62_000_000,
    Harrier: 38_000_000,
    RAV4: 40_000_000,
    Hiace: 42_000_000,
    Premio: 20_000_000,
    "Corolla Axio": 18_000_000,
    Allion: 19_000_000,
    Vitz: 12_000_000,
    Passo: 11_000_000,
    Succeed: 16_000_000,
    Noah: 26_000_000,
    Wish: 18_000_000,
  },
  Nissan: {
    Navara: 38_000_000,
    "X-Trail": 32_000_000,
    Dualis: 26_000_000,
    Serena: 24_000_000,
    Note: 14_000_000,
    Tiida: 14_000_000,
    March: 11_000_000,
    Wingroad: 15_000_000,
    Patrol: 72_000_000,
  },
  Honda: {
    Fit: 16_000_000,
    Vezel: 28_000_000,
    "CR-V": 35_000_000,
    Civic: 22_000_000,
    Freed: 20_000_000,
    Shuttle: 18_000_000,
    Accord: 24_000_000,
  },
  Mazda: {
    "CX-5": 38_000_000,
    "CX-3": 24_000_000,
    Axela: 22_000_000,
    Atenza: 26_000_000,
    Demio: 14_000_000,
    Premacy: 18_000_000,
    BT50: 36_000_000,
  },
  Mitsubishi: {
    Pajero: 55_000_000,
    L200: 35_000_000,
    Outlander: 32_000_000,
    RVR: 20_000_000,
    ASX: 22_000_000,
    Triton: 36_000_000,
    Lancer: 16_000_000,
  },
  Suzuki: {
    Swift: 14_000_000,
    Vitara: 26_000_000,
    Jimny: 28_000_000,
    Every: 12_000_000,
    Alto: 9_000_000,
    "Grand Vitara": 24_000_000,
    Solio: 13_000_000,
  },
};

export const ANNUAL_DEPRECIATION = 0.08;
export const EXPECTED_KM_PER_YEAR = 15_000;
export const MILEAGE_ADJUST_PER_10K = 0.015;
export const MIN_VALUE_RATIO = 0.12;
export const RANGE_SPREAD = 0.1;
const PRICE_STEP = 50_000;

export const VALUATION_MAKES = Object.keys(BASE_PRICES);

export function modelsForMake(make: string): string[] {
  return Object.keys(BASE_PRICES[make] ?? {});
}

export function valuationYears(now = new Date().getFullYear()): number[] {
  const years: number[] = [];
  for (let year = now; year >= 1998; year -= 1) {
    years.push(year);
  }
  return years;
}

export type ValuationInput = {
  make: string;
  model: string;
  year: number;
  mileage: number;
  asOfYear?: number;
};

export type ValuationResult = {
  make: string;
  model: string;
  year: number;
  mileage: number;
  ageYears: number;
  basePrice: number;
  ageFactor: number;
  expectedMileage: number;
  mileageDelta: number;
  mileageFactor: number;
  midpoint: number;
  low: number;
  high: number;
};

function roundPrice(value: number): number {
  return Math.max(PRICE_STEP, Math.round(value / PRICE_STEP) * PRICE_STEP);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function estimateValuation(input: ValuationInput): ValuationResult | null {
  const basePrice = BASE_PRICES[input.make]?.[input.model];
  if (!basePrice) return null;

  const asOfYear = input.asOfYear ?? new Date().getFullYear();
  const ageYears = Math.max(0, asOfYear - input.year);
  const ageFactor = Math.pow(1 - ANNUAL_DEPRECIATION, ageYears);

  const expectedMileage = Math.max(ageYears, 1) * EXPECTED_KM_PER_YEAR;
  const mileageDelta = input.mileage - expectedMileage;
  const mileageFactor = clamp(
    1 - (mileageDelta / 10_000) * MILEAGE_ADJUST_PER_10K,
    0.7,
    1.2,
  );

  const raw = basePrice * ageFactor * mileageFactor;
  const midpoint = roundPrice(Math.max(basePrice * MIN_VALUE_RATIO, raw));
  const low = roundPrice(midpoint * (1 - RANGE_SPREAD));
  const high = roundPrice(midpoint * (1 + RANGE_SPREAD));

  return {
    make: input.make,
    model: input.model,
    year: input.year,
    mileage: input.mileage,
    ageYears,
    basePrice,
    ageFactor,
    expectedMileage,
    mileageDelta,
    mileageFactor,
    midpoint,
    low,
    high,
  };
}
