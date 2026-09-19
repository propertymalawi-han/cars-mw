import type { Metadata } from "next";
import nextDynamic from "next/dynamic";
import Link from "next/link";
import {
  CarFront,
  MessageSquare,
  ShieldAlert,
  Users,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminOverviewStats } from "@/lib/admin-overview";
import { formatNumber } from "@/lib/currency";
import { formatRelativeTime } from "@/lib/format-date";
import type { ListingStatus } from "@/types";

const AdminListingsChart = nextDynamic(
  () =>
    import("@/components/admin/overview-charts").then(
      (mod) => mod.AdminListingsChart,
    ),
  { ssr: false, loading: () => <Skeleton className="h-[220px] w-full" /> },
);

const AdminSignupsChart = nextDynamic(
  () =>
    import("@/components/admin/overview-charts").then(
      (mod) => mod.AdminSignupsChart,
    ),
  { ssr: false, loading: () => <Skeleton className="h-[220px] w-full" /> },
);

export const metadata: Metadata = {
  title: "Overview",
};

const STATUS_ORDER: ListingStatus[] = ["active", "sold", "expired", "draft", "muted"];

const STATUS_LABEL: Record<ListingStatus, string> = {
  active: "Active",
  sold: "Sold",
  expired: "Expired",
  draft: "Draft",
  muted: "Muted",
};

export default async function AdminOverviewPage() {
  const stats = await getAdminOverviewStats();

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Overview"
        description="Marketplace health across listings, users, and enquiries."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 p-3 pb-2">
            <CardTitle className="text-[13px] font-medium">Total listings</CardTitle>
            <CarFront className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2 p-3 pt-0">
            <p className="text-2xl font-semibold tabular-nums">
              {formatNumber(stats.listings.total)}
            </p>
            <div className="flex flex-wrap gap-1">
              {STATUS_ORDER.map((status) => (
                <Badge
                  key={status}
                  variant={status === "active" ? "success" : "secondary"}
                  className="px-1.5 py-0 text-[0.62rem]"
                >
                  {STATUS_LABEL[status]} {formatNumber(stats.listings.byStatus[status])}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 p-3 pb-2">
            <CardTitle className="text-[13px] font-medium">Total users</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2 p-3 pt-0">
            <p className="text-2xl font-semibold tabular-nums">
              {formatNumber(stats.users.total)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatNumber(stats.users.byAccountType.individual)} individual ·{" "}
              {formatNumber(stats.users.byAccountType.dealer)} dealer
            </p>
            <p className="text-xs text-muted-foreground">
              {formatNumber(stats.users.signupsThisWeek)} this week ·{" "}
              {formatNumber(stats.users.signupsThisMonth)} this month
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 p-3 pb-2">
            <CardTitle className="text-[13px] font-medium">Enquiries sent</CardTitle>
            <MessageSquare className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1 p-3 pt-0">
            <p className="text-2xl font-semibold tabular-nums">
              {formatNumber(stats.enquiries.thisWeek)}
            </p>
            <CardDescription className="text-xs">This week</CardDescription>
            <p className="text-xs text-muted-foreground">
              {formatNumber(stats.enquiries.thisMonth)} this month
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 p-3 pb-2">
            <CardTitle className="text-[13px] font-medium">
              Pending dealer verifications
            </CardTitle>
            <ShieldAlert className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2 p-3 pt-0">
            <p className="text-2xl font-semibold tabular-nums">
              {formatNumber(stats.pendingDealerVerifications)}
            </p>
            <p className="text-xs text-muted-foreground">
              {stats.pendingDealerVerifications === 0
                ? "No dealerships waiting for review."
                : "Unverified dealerships awaiting staff review."}
            </p>
            <Button asChild variant="outline" size="sm" className="h-8">
              <Link href="/admin/users?filter=unverified-dealers">Review</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-[13px] font-medium">
              New listings per day
            </CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <AdminListingsChart data={stats.listingsPerDay} />
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-[13px] font-medium">
              New user signups per day
            </CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <AdminSignupsChart data={stats.signupsPerDay} />
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-none">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-[13px] font-medium">Recent activity</CardTitle>
          <CardDescription>
            Latest 10 listings created and latest 10 signups, merged by time.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {stats.recentActivity.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No listings or signups yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-9 w-[7.5rem]">When</TableHead>
                  <TableHead className="h-9 w-[6.5rem]">Type</TableHead>
                  <TableHead className="h-9">Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentActivity.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="py-2 text-xs text-muted-foreground">
                      {formatRelativeTime(item.createdAt)}
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge
                        variant={item.kind === "listing" ? "copper" : "secondary"}
                        className="px-1.5 py-0 text-[0.62rem]"
                      >
                        {item.kind === "listing" ? "Listing" : "Signup"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2">
                      {item.href ? (
                        <Link
                          href={item.href}
                          className="font-medium hover:text-copper"
                        >
                          {item.title}
                        </Link>
                      ) : (
                        <span className="font-medium">{item.title}</span>
                      )}
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
