/**
 * Placeholder Malawi used-vehicle duty bands.
 *
 * Rates follow the commonly published MRA used-passenger-vehicle schedule:
 * 25% import duty, 16.5% VAT, and excise that steps up with engine size and
 * age. Treat CIF as the customs value (CIF + port charges in a live assessment).
 * Refine against the current Customs & Excise Tariff before quoting buyers.
 */
export const IMPORT_DUTY_RATE = 0.25;
export const IMPORT_VAT_RATE = 0.165;

export type EngineBand = {
  id: string;
  label: string;
  minCc: number;
  maxCc: number;
};

export type AgeBandId = "0-8" | "8-12" | "12+";

export type AgeBand = {
  id: AgeBandId;
  label: string;
};

export const ENGINE_BANDS: EngineBand[] = [
  { id: "1000-1499", label: "Up to 1,499 cc", minCc: 0, maxCc: 1499 },
  { id: "1500-1999", label: "1,500 – 1,999 cc", minCc: 1500, maxCc: 1999 },
  { id: "2000-2499", label: "2,000 – 2,499 cc", minCc: 2000, maxCc: 2499 },
  { id: "2500-2999", label: "2,500 – 2,999 cc", minCc: 2500, maxCc: 2999 },
  { id: "3000+", label: "3,000 cc and above", minCc: 3000, maxCc: Number.POSITIVE_INFINITY },
];

export const AGE_BANDS: AgeBand[] = [
  { id: "0-8", label: "0 – 7 years" },
  { id: "8-12", label: "8 – 11 years" },
  { id: "12+", label: "12 years and older" },
];

/** Excise % by engine band id and age band. */
export const EXCISE_RATES: Record<string, Record<AgeBandId, number>> = {
  "1000-1499": { "0-8": 0, "8-12": 0.3, "12+": 0.6 },
  "1500-1999": { "0-8": 0.15, "8-12": 0.45, "12+": 0.75 },
  "2000-2499": { "0-8": 0.35, "8-12": 0.6, "12+": 0.9 },
  "2500-2999": { "0-8": 0.45, "8-12": 0.7, "12+": 1 },
  "3000+": { "0-8": 0.55, "8-12": 0.8, "12+": 1.1 },
};

export function engineBandForCc(cc: number): EngineBand | undefined {
  if (!Number.isFinite(cc) || cc <= 0) return undefined;
  return ENGINE_BANDS.find((band) => cc >= band.minCc && cc <= band.maxCc);
}

export function ageBandForYears(age: number): AgeBand | undefined {
  if (!Number.isFinite(age) || age < 0) return undefined;
  if (age < 8) return AGE_BANDS[0];
  if (age < 12) return AGE_BANDS[1];
  return AGE_BANDS[2];
}

export type DutyInput = {
  cif: number;
  engineCc: number;
  ageYears: number;
};

export type DutyResult = {
  cif: number;
  engineCc: number;
  ageYears: number;
  engineBand: EngineBand;
  ageBand: AgeBand;
  importDutyRate: number;
  exciseRate: number;
  vatRate: number;
  importDuty: number;
  excise: number;
  vat: number;
  totalDuty: number;
  landedCost: number;
};

function roundMwk(value: number): number {
  return Math.round(value);
}

export function estimateImportDuty(input: DutyInput): DutyResult | null {
  if (!Number.isFinite(input.cif) || input.cif <= 0) return null;

  const engineBand = engineBandForCc(input.engineCc);
  const ageBand = ageBandForYears(input.ageYears);
  if (!engineBand || !ageBand) return null;

  const exciseRate = EXCISE_RATES[engineBand.id]?.[ageBand.id];
  if (exciseRate == null) return null;

  const importDuty = roundMwk(input.cif * IMPORT_DUTY_RATE);
  const excise = roundMwk((input.cif + importDuty) * exciseRate);
  const vat = roundMwk((input.cif + importDuty + excise) * IMPORT_VAT_RATE);
  const totalDuty = importDuty + excise + vat;

  return {
    cif: roundMwk(input.cif),
    engineCc: input.engineCc,
    ageYears: input.ageYears,
    engineBand,
    ageBand,
    importDutyRate: IMPORT_DUTY_RATE,
    exciseRate,
    vatRate: IMPORT_VAT_RATE,
    importDuty,
    excise,
    vat,
    totalDuty,
    landedCost: roundMwk(input.cif) + totalDuty,
  };
}
