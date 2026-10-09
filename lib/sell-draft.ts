import type { ListingFormInput, SellStepId } from "@/lib/validations/listing";

const SELL_DRAFT_KEY = "carsmw-sell-draft";

export type SellDraft = {
  values: Partial<ListingFormInput>;
  resumeStep?: SellStepId;
};

export function readSellDraft(): SellDraft | null {
  try {
    const raw = localStorage.getItem(SELL_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SellDraft;
    if (!parsed || typeof parsed !== "object" || !parsed.values || typeof parsed.values !== "object") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveSellDraft(values: Partial<ListingFormInput>, resumeStep?: SellStepId) {
  try {
    const existing = readSellDraft();
    const images = Array.isArray(values.images)
      ? values.images.filter((url) => typeof url === "string" && url.startsWith("http"))
      : [];
    const payload: SellDraft = {
      values: { ...values, images },
      resumeStep: resumeStep ?? existing?.resumeStep,
    };
    localStorage.setItem(SELL_DRAFT_KEY, JSON.stringify(payload));
  } catch {
    // Private mode and full storage should not block listing a vehicle.
  }
}

export function clearSellDraft() {
  try {
    localStorage.removeItem(SELL_DRAFT_KEY);
  } catch {
    // ignore
  }
}
