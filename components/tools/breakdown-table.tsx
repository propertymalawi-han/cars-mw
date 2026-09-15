import { cn } from "@/lib/utils";

export type BreakdownRow = {
  label: string;
  value: string;
  total?: boolean;
};

export function BreakdownTable({
  rows,
  caption,
}: {
  rows: BreakdownRow[];
  caption?: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <table className="w-full text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.label}
              className={cn(
                index < rows.length - 1 ? "border-b" : undefined,
                row.total && "bg-muted/70",
              )}
            >
              <th
                scope="row"
                className={cn(
                  "w-[55%] px-4 py-2.5 text-left font-medium",
                  row.total
                    ? "text-foreground"
                    : "bg-muted/60 text-muted-foreground",
                )}
              >
                {row.label}
              </th>
              <td
                className={cn(
                  "px-4 py-2.5 text-right tabular-nums",
                  row.total ? "font-semibold" : "font-medium",
                )}
              >
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
