import type { Metadata } from "next";
import nextDynamic from "next/dynamic";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AnalyticsDateRangePicker } from "@/components/admin/analytics-date-range";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getAdminAnalytics,
  parseAdminAnalyticsSearchParams,
} from "@/lib/admin-analytics";

const AnalyticsDashboard = nextDynamic(
  () =>
    import("@/components/admin/analytics-dashboard").then(
      (mod) => mod.AnalyticsDashboard,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-[320px] w-full" />
        <Skeleton className="h-[340px] w-full" />
        <div className="grid gap-3 lg:grid-cols-2">
          <Skeleton className="h-[320px] w-full" />
          <Skeleton className="h-[320px] w-full" />
        </div>
      </div>
    ),
  },
);

export const metadata: Metadata = {
  title: "Analytics",
};

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const filters = parseAdminAnalyticsSearchParams(searchParams);
  const data = await getAdminAnalytics(filters);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Analytics"
        description="Marketplace trends across listings, users, enquiries, and time-to-sale."
        actions={<AnalyticsDateRangePicker filters={filters} />}
      />
      <AnalyticsDashboard data={data} />
    </div>
  );
}
