import type { Metadata } from "next";
import nextDynamic from "next/dynamic";
import { Eye, MessageSquare, ShieldCheck, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getDealerOverviewStats, requireDealerPage } from "@/lib/dealer";

const DealerActivityChart = nextDynamic(
  () =>
    import("@/components/dealer/activity-chart").then(
      (mod) => mod.DealerActivityChart,
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[280px] w-full" />,
  },
);

export const metadata: Metadata = {
  title: "Dealer overview",
};

export const dynamic = "force-dynamic";

export default async function DealerOverviewPage() {
  const { user, dealer } = await requireDealerPage("/dealer/dashboard");
  if (!dealer) return null;

  const stats = await getDealerOverviewStats(user.id, dealer.id);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {dealer.verified ? (
            <Badge variant="success">Verified dealer</Badge>
          ) : (
            <Badge variant="secondary">Unverified</Badge>
          )}
        </div>
        <h1 className="text-[clamp(1.5rem,1.1rem+2vw,1.875rem)] font-semibold tracking-tight">
          Overview
        </h1>
        <p className="text-muted-foreground">
          Stock, views, and buyer enquiries for {dealer.name}.
        </p>
      </div>

      {!dealer.verified ? (
        <p className="rounded-md border bg-card px-3 py-2.5 text-sm text-muted-foreground">
          Verification is manual for now. The{" "}
          <span className="font-medium text-foreground">Verified dealer</span> badge
          will appear on your listings after CarsMW reviews this account.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Active listings"
          value={stats.activeListings}
          description="Live vehicles in search"
          icon={Store}
        />
        <StatCard
          title="Views this month"
          value={stats.viewsThisMonth}
          description="Unique buyers who opened a listing"
          icon={Eye}
        />
        <StatCard
          title="Enquiries this month"
          value={stats.enquiriesThisMonth}
          description="Messages received on your stock"
          icon={MessageSquare}
        />
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verification</CardTitle>
            <ShieldCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {dealer.verified ? (
              <Badge variant="success">Verified</Badge>
            ) : (
              <Badge variant="secondary">Unverified</Badge>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {dealer.verified
                ? "Buyers see the verified badge on your listings."
                : "Awaiting a manual review by CarsMW."}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity · last 30 days</CardTitle>
          <CardDescription>Listing views and enquiries received.</CardDescription>
        </CardHeader>
        <CardContent>
          <DealerActivityChart data={stats.chart} />
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: typeof Store;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tabular-nums">{value.toLocaleString("en-MW")}</p>
        <CardDescription className="mt-1">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}
