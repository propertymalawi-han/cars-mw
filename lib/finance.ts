export const LOAN_TERMS_MONTHS = [12, 24, 36, 48, 60, 72] as const;

export type InstalmentInput = {
  principal: number;
  annualRatePercent: number;
  termMonths: number;
};

export type InstalmentResult = {
  principal: number;
  annualRatePercent: number;
  termMonths: number;
  monthlyRate: number;
  monthlyPayment: number;
  totalRepayable: number;
  totalInterest: number;
};

function roundMwk(value: number): number {
  return Math.round(value);
}

export function estimateMonthlyInstalment(
  input: InstalmentInput,
): InstalmentResult | null {
  const { principal, annualRatePercent, termMonths } = input;
  if (!Number.isFinite(principal) || principal <= 0) return null;
  if (!Number.isFinite(annualRatePercent) || annualRatePercent < 0) return null;
  if (!Number.isInteger(termMonths) || termMonths <= 0) return null;

  const monthlyRate = annualRatePercent / 100 / 12;
  const monthlyPayment =
    monthlyRate === 0
      ? principal / termMonths
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
        (Math.pow(1 + monthlyRate, termMonths) - 1);

  if (!Number.isFinite(monthlyPayment)) return null;

  const payment = roundMwk(monthlyPayment);
  const totalRepayable = payment * termMonths;

  return {
    principal: roundMwk(principal),
    annualRatePercent,
    termMonths,
    monthlyRate,
    monthlyPayment: payment,
    totalRepayable,
    totalInterest: totalRepayable - roundMwk(principal),
  };
}
