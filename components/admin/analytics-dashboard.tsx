"use client";

import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ANALYTICS_INTERVALS,
  adminAnalyticsHref,
  formatAnalyticsBucket,
  type AdminAnalyticsData,
  type AdminAnalyticsFilters,
  type AnalyticsInterval,
} from "@/lib/admin-analytics";
import { formatNumber, formatPercent } from "@/lib/currency";
import { downloadCsv, type CsvValue } from "@/lib/download-csv";
import { LISTING_STATUS_LABEL } from "@/lib/listing-featured";
import {
  VEHICLE_CATEGORIES,
  categoryDisplayName,
} from "@/lib/vehicle-search";

const listingsConfig = {
  count: { label: "Listings", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

const statusConfig = {
  active: { label: "Active", color: "hsl(var(--chart-2))" },
  sold: { label: "Sold", color: "hsl(var(--chart-1))" },
  expired: { label: "Expired", color: "hsl(var(--chart-4))" },
  draft: { label: "Draft", color: "hsl(var(--chart-3))" },
  muted: { label: "Muted", color: "hsl(var(--destructive))" },
} satisfies ChartConfig;

const namedCountConfig = {
  count: { label: "Listings", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

const userGrowthConfig = {
  individual: { label: "Individual", color: "hsl(var(--chart-3))" },
  dealer: { label: "Dealer", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

const enquiryConfig = {
  enquiries: { label: "Enquiries", color: "hsl(var(--chart-1))" },
  conversionPct: { label: "Conversion %", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

const timeToSaleConfig = {
  avgDays: { label: "Avg days", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

function csvName(stem: string, filters: AdminAnalyticsFilters) {
  return `${stem}-${filters.from}-to-${filters.to}.csv`;
}

function CsvButton({
  filename,
  rows,
}: {
  filename: string;
  rows: Array<Record<string, CsvValue>>;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-7 px-2 text-xs"
      disabled={rows.length === 0}
      onClick={() => downloadCsv(filename, rows)}
    >
      <Download className="size-3.5" />
      CSV
    </Button>
  );
}

function ChartEmpty({ label = "No data in this range." }: { label?: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function IntervalToggle({ filters }: { filters: AdminAnalyticsFilters }) {
  const router = useRouter();
  const labels: Record<AnalyticsInterval, string> = {
    day: "Daily",
    week: "Weekly",
    month: "Monthly",
  };

  return (
    <div className="flex rounded-md border p-0.5">
      {ANALYTICS_INTERVALS.map((interval) => (
        <Button
          key={interval}
          type="button"
          variant={filters.interval === interval ? "secondary" : "ghost"}
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => router.push(adminAnalyticsHref({ ...filters, interval }))}
        >
          {labels[interval]}
        </Button>
      ))}
    </div>
  );
}

function CategoryFilter({ filters }: { filters: AdminAnalyticsFilters }) {
  const router = useRouter();

  return (
    <Select
      value={filters.category ?? "all"}
      onValueChange={(value) =>
        router.push(
          adminAnalyticsHref({
            ...filters,
            category: value === "all" ? undefined : value,
          }),
        )
      }
    >
      <SelectTrigger className="h-7 w-[140px] md:h-7" aria-label="Filter listings by category">
        <SelectValue placeholder="All categories" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All categories</SelectItem>
        {VEHICLE_CATEGORIES.map((category) => (
          <SelectItem key={category} value={category}>
            {categoryDisplayName(category)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function tickFormatter(interval: AnalyticsInterval) {
  return (value: string) => formatAnalyticsBucket(value, interval);
}

export function AnalyticsDashboard({ data }: { data: AdminAnalyticsData }) {
  const { filters } = data;
  const interval = filters.interval;
  const formatTick = tickFormatter(interval);

  const statusPie = data.listingsByStatus
    .filter((row) => row.count > 0)
    .map((row) => ({
      ...row,
      fill: `var(--color-${row.status})`,
    }));

  const enquiryChart = data.enquiries.map((row) => ({
    ...row,
    conversionPct: Math.round(row.conversionRate * 1000) / 10,
  }));

  const timeToSaleChart = data.timeToSale.trend.map((row) => ({
    ...row,
    avgDays:
      row.avgDays == null ? null : Math.round(row.avgDays * 10) / 10,
  }));

  const listingsCreatedRows = data.listingsCreated.map((row) => ({
    period: formatAnalyticsBucket(row.date, interval),
    listings: row.count,
  }));
  const statusRows = data.listingsByStatus.map((row) => ({
    status: LISTING_STATUS_LABEL[row.status],
    count: row.count,
  }));
  const makeRows = data.topMakes.map((row) => ({ make: row.name, count: row.count }));
  const districtRows = data.topDistricts.map((row) => ({
    district: row.name,
    count: row.count,
  }));
  const userRows = data.userGrowth.map((row) => ({
    period: formatAnalyticsBucket(row.date, interval),
    individual: row.individual,
    dealer: row.dealer,
  }));
  const enquiryRows = data.enquiries.map((row) => ({
    period: formatAnalyticsBucket(row.date, interval),
    enquiries: row.enquiries,
    listings_created: row.listings,
    listings_with_enquiry: row.listingsWithEnquiry,
    conversion_rate_pct: Math.round(row.conversionRate * 1000) / 10,
  }));
  const timeToSaleRows = data.timeToSale.trend
    .filter((row) => row.soldCount > 0)
    .map((row) => ({
      period: formatAnalyticsBucket(row.date, interval),
      avg_days: row.avgDays == null ? "" : Math.round(row.avgDays * 10) / 10,
      sold_listings: row.soldCount,
    }));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Listings created"
          value={formatNumber(data.totals.listingsCreated)}
          hint={filters.category ? categoryDisplayName(filters.category) : "All categories"}
        />
        <StatCard
          title="Average time-to-sale"
          value={
            data.timeToSale.averageDays == null
              ? "—"
              : `${formatNumber(Math.round(data.timeToSale.averageDays * 10) / 10)} days`
          }
          hint={
            data.timeToSale.soldCount === 0
              ? "No sold listings in this range"
              : `${formatNumber(data.timeToSale.soldCount)} sold listing${data.timeToSale.soldCount === 1 ? "" : "s"}`
          }
        />
        <StatCard
          title="Enquiries"
          value={formatNumber(data.totals.enquiries)}
          hint={`${formatNumber(data.totals.usersCreated)} new users`}
        />
        <StatCard
          title="Enquiry conversion"
          value={
            data.totals.conversionRate == null
              ? "—"
              : formatPercent(data.totals.conversionRate)
          }
          hint="New listings that received at least one enquiry"
        />
      </div>

      <Card className="shadow-none">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 p-3 pb-2">
          <div>
            <CardTitle className="text-[13px] font-medium">Time-to-sale</CardTitle>
            <CardDescription>
              Days between listing created and status changing to Sold.
            </CardDescription>
          </div>
          <CsvButton filename={csvName("time-to-sale", filters)} rows={timeToSaleRows} />
        </CardHeader>
        <CardContent className="p-3 pt-0">
          {data.timeToSale.soldCount === 0 ? (
            <ChartEmpty label="No sold listings in this range." />
          ) : (
            <ChartContainer config={timeToSaleConfig} className="aspect-auto h-[260px] w-full">
              <LineChart data={timeToSaleChart} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={28}
                  tickFormatter={formatTick}
                />
                <YAxis
                  allowDecimals
                  tickLine={false}
                  axisLine={false}
                  width={36}
                  tickFormatter={(value: number) => String(value)}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => formatAnalyticsBucket(String(value), interval)}
                    />
                  }
                />
                <Line
                  dataKey="avgDays"
                  type="monotone"
                  stroke="var(--color-avgDays)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 p-3 pb-2">
          <div>
            <CardTitle className="text-[13px] font-medium">Listings created</CardTitle>
            <CardDescription>New listings over time, grouped by the selected interval.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CategoryFilter filters={filters} />
            <IntervalToggle filters={filters} />
            <CsvButton filename={csvName("listings-created", filters)} rows={listingsCreatedRows} />
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          {data.totals.listingsCreated === 0 ? (
            <ChartEmpty />
          ) : (
            <ChartContainer config={listingsConfig} className="aspect-auto h-[280px] w-full">
              <BarChart data={data.listingsCreated} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={28}
                  tickFormatter={formatTick}
                />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => formatAnalyticsBucket(String(value), interval)}
                    />
                  }
                />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        <StatusChart
          data={statusPie}
          rows={statusRows}
          filename={csvName("listings-by-status", filters)}
        />

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 p-3 pb-2">
            <div>
              <CardTitle className="text-[13px] font-medium">User growth</CardTitle>
              <CardDescription>New accounts, individual vs dealer.</CardDescription>
            </div>
            <CsvButton filename={csvName("user-growth", filters)} rows={userRows} />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {data.totals.usersCreated === 0 ? (
              <ChartEmpty />
            ) : (
              <ChartContainer config={userGrowthConfig} className="aspect-auto h-[260px] w-full">
                <AreaChart data={data.userGrowth} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={28}
                    tickFormatter={formatTick}
                  />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => formatAnalyticsBucket(String(value), interval)}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area
                    type="monotone"
                    dataKey="individual"
                    stackId="users"
                    stroke="var(--color-individual)"
                    fill="var(--color-individual)"
                    fillOpacity={0.35}
                  />
                  <Area
                    type="monotone"
                    dataKey="dealer"
                    stackId="users"
                    stroke="var(--color-dealer)"
                    fill="var(--color-dealer)"
                    fillOpacity={0.55}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <NamedBarCard
          title="Top 10 makes"
          description="Listing count by make."
          filename={csvName("top-makes", filters)}
          rows={makeRows}
          data={data.topMakes}
        />
        <NamedBarCard
          title="Top districts"
          description="Listing count by district."
          filename={csvName("top-districts", filters)}
          rows={districtRows}
          data={data.topDistricts}
        />
      </div>

      <Card className="shadow-none">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 p-3 pb-2">
          <div>
            <CardTitle className="text-[13px] font-medium">Enquiries and conversion</CardTitle>
            <CardDescription>
              Enquiry volume vs the share of new listings that received an enquiry.
            </CardDescription>
          </div>
          <CsvButton filename={csvName("enquiries", filters)} rows={enquiryRows} />
        </CardHeader>
        <CardContent className="p-3 pt-0">
          {data.totals.enquiries === 0 && data.totals.listingsCreated === 0 ? (
            <ChartEmpty />
          ) : (
            <ChartContainer config={enquiryConfig} className="aspect-auto h-[280px] w-full">
              <ComposedChart data={enquiryChart} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={28}
                  tickFormatter={formatTick}
                />
                <YAxis
                  yAxisId="left"
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  width={36}
                  tickFormatter={(value: number) => `${value}%`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => formatAnalyticsBucket(String(value), interval)}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  yAxisId="left"
                  dataKey="enquiries"
                  fill="var(--color-enquiries)"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="conversionPct"
                  stroke="var(--color-conversionPct)"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="shadow-none">
      <CardHeader className="space-y-0 p-3 pb-2">
        <CardTitle className="text-[13px] font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 p-3 pt-0">
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function StatusChart({
  data,
  rows,
  filename,
}: {
  data: Array<{ status: string; count: number; fill: string }>;
  rows: Array<Record<string, CsvValue>>;
  filename: string;
}) {
  return (
    <Card className="shadow-none">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 p-3 pb-2">
        <div>
          <CardTitle className="text-[13px] font-medium">Listings by status</CardTitle>
          <CardDescription>Current status of listings created in this range.</CardDescription>
        </div>
        <CsvButton filename={filename} rows={rows} />
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {data.length === 0 ? (
          <ChartEmpty />
        ) : (
          <Tabs defaultValue="donut">
            <TabsList className="h-8">
              <TabsTrigger value="donut" className="h-7 px-2.5 text-xs">
                Donut
              </TabsTrigger>
              <TabsTrigger value="bar" className="h-7 px-2.5 text-xs">
                Bar
              </TabsTrigger>
            </TabsList>
            <TabsContent value="donut" className="mt-2">
              <StatusDonut data={data} />
            </TabsContent>
            <TabsContent value="bar" className="mt-2">
              <StatusBar data={data} />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

function StatusDonut({
  data,
}: {
  data: Array<{ status: string; count: number; fill: string }>;
}) {
  return (
    <ChartContainer config={statusConfig} className="aspect-auto mx-auto h-[240px] w-full max-w-[320px]">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
        <Pie
          data={data}
          dataKey="count"
          nameKey="status"
          innerRadius={58}
          outerRadius={88}
          strokeWidth={2}
        >
          {data.map((entry) => (
            <Cell key={entry.status} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey="status" />}
          className="-translate-y-1 flex-wrap gap-2"
        />
      </PieChart>
    </ChartContainer>
  );
}

function StatusBar({
  data,
}: {
  data: Array<{ status: string; count: number; fill: string }>;
}) {
  return (
    <ChartContainer config={statusConfig} className="aspect-auto h-[240px] w-full">
      <BarChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="status"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value: string) =>
            LISTING_STATUS_LABEL[value as keyof typeof LISTING_STATUS_LABEL] ?? value
          }
        />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.status} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

function NamedBarCard({
  title,
  description,
  filename,
  rows,
  data,
}: {
  title: string;
  description: string;
  filename: string;
  rows: Array<Record<string, CsvValue>>;
  data: Array<{ name: string; count: number }>;
}) {
  return (
    <Card className="shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 p-3 pb-2">
        <div>
          <CardTitle className="text-[13px] font-medium">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <CsvButton filename={filename} rows={rows} />
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {data.length === 0 ? (
          <ChartEmpty />
        ) : (
          <ChartContainer config={namedCountConfig} className="aspect-auto h-[280px] w-full">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 8, right: 12, top: 8, bottom: 0 }}
            >
              <CartesianGrid horizontal={false} />
              <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                width={88}
                tickFormatter={(value: string) =>
                  value.length > 12 ? `${value.slice(0, 12)}…` : value
                }
              />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
