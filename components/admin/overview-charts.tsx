"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatDate } from "@/lib/format-date";
import type { AdminChartPoint } from "@/lib/admin-overview";

const listingsConfig = {
  count: {
    label: "Listings",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const signupsConfig = {
  count: {
    label: "Signups",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

function AdminLineChart({
  data,
  config,
  colorVar,
}: {
  data: AdminChartPoint[];
  config: ChartConfig;
  colorVar: string;
}) {
  return (
    <ChartContainer config={config} className="aspect-auto h-[220px] w-full">
      <LineChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={28}
          tickFormatter={(value: string) =>
            formatDate(value).replace(/ \d{4}$/, "")
          }
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          width={28}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(value) => formatDate(String(value))}
            />
          }
        />
        <Line
          dataKey="count"
          type="monotone"
          stroke={colorVar}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}

export function AdminListingsChart({ data }: { data: AdminChartPoint[] }) {
  return (
    <AdminLineChart
      data={data}
      config={listingsConfig}
      colorVar="var(--color-count)"
    />
  );
}

export function AdminSignupsChart({ data }: { data: AdminChartPoint[] }) {
  return (
    <AdminLineChart
      data={data}
      config={signupsConfig}
      colorVar="var(--color-count)"
    />
  );
}
