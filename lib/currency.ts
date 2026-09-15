const mwkFormatter = new Intl.NumberFormat("en-MW", {
  maximumFractionDigits: 0,
});

export function formatMWK(amount: number): string {
  return `MWK ${mwkFormatter.format(amount)}`;
}

export function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toLocaleString("en-MW", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })}%`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString("en-MW");
}
