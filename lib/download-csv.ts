export type CsvValue = string | number | null | undefined;

export function downloadCsv(
  filename: string,
  rows: Array<Record<string, CsvValue>>,
) {
  if (rows.length === 0 || typeof document === "undefined") return;

  const headers = Object.keys(rows[0]);
  const escape = (value: CsvValue) => {
    if (value == null) return "";
    const text = String(value);
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };

  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
