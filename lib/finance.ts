export const LOAN_TERMS_MONTHS = [12, 24, 36, 48, 60, 72] as const;
export const DEFAULT_FINANCE_ANNUAL_RATE_PERCENT = 24;
export const DEFAULT_FINANCE_TERM_MONTHS = 60;

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

export function principalFromMonthlyPayment(
  monthlyPayment: number,
  annualRatePercent = DEFAULT_FINANCE_ANNUAL_RATE_PERCENT,
  termMonths = DEFAULT_FINANCE_TERM_MONTHS,
): number | null {
  if (!Number.isFinite(monthlyPayment) || monthlyPayment <= 0) return null;
  if (!Number.isFinite(annualRatePercent) || annualRatePercent < 0) return null;
  if (!Number.isInteger(termMonths) || termMonths <= 0) return null;

  const monthlyRate = annualRatePercent / 100 / 12;
  const principal =
    monthlyRate === 0
      ? monthlyPayment * termMonths
      : (monthlyPayment * (1 - Math.pow(1 + monthlyRate, -termMonths))) /
        monthlyRate;

  if (!Number.isFinite(principal) || principal <= 0) return null;
  return roundMwk(principal);
}
