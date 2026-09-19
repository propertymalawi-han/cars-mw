import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminUsersDataTable } from "@/components/admin/users-data-table";
import { AdminUsersFilters } from "@/components/admin/users-filters";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAdminUsers,
  getPendingDealerVerifications,
  parseAdminUserSearchParams,
} from "@/lib/admin-users";
import { formatNumber } from "@/lib/currency";
import { formatRelativeTime } from "@/lib/format-date";

export const metadata: Metadata = {
  title: "Users",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const filters = parseAdminUserSearchParams(searchParams);
  const [{ users, total, pageCount }, pendingDealers] = await Promise.all([
    getAdminUsers(filters),
    getPendingDealerVerifications(),
  ]);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Users"
        description="Search accounts, review dealer verification, and open a user for moderation."
      />

      {pendingDealers.length > 0 ? (
        <Card
          id="verifications"
          className={filters.unverifiedDealers ? "shadow-none ring-1 ring-copper/40" : "shadow-none"}
        >
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-[13px] font-medium">
              Pending dealer verifications
            </CardTitle>
            <CardDescription>
              {pendingDealers.length} dealership{pendingDealers.length === 1 ? "" : "s"} waiting
              for review.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-9">Dealership</TableHead>
                  <TableHead className="h-9">Owner</TableHead>
                  <TableHead className="h-9">Phone</TableHead>
                  <TableHead className="h-9">Requested</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingDealers.map((dealer) => (
                  <TableRow key={dealer.id}>
                    <TableCell className="py-2">
                      <Link
                        href={`/admin/users/${dealer.user.id}`}
                        className="font-medium hover:text-copper"
                      >
                        {dealer.name}
                      </Link>
                    </TableCell>
                    <TableCell className="py-2">
                      <Link href={`/admin/users/${dealer.user.id}`}>
                        <p>{dealer.user.name}</p>
                        <p className="text-xs text-muted-foreground">{dealer.user.email}</p>
                      </Link>
                    </TableCell>
                    <TableCell className="py-2 tabular-nums">{dealer.phone}</TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">
                      {formatRelativeTime(dealer.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      <Card className="shadow-none">
        <CardHeader className="p-3 pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-[13px] font-medium">All users</CardTitle>
            {filters.unverifiedDealers ? (
              <Badge variant="copper" className="px-1.5 py-0 text-[0.62rem]">
                Unverified dealers
              </Badge>
            ) : null}
          </div>
          <CardDescription>
            {formatNumber(total)} user{total === 1 ? "" : "s"} in this view.
          </CardDescription>
        </CardHeader>
        <AdminUsersFilters filters={filters} />
        <CardContent className="p-0">
          <AdminUsersDataTable
            users={users}
            total={total}
            pageCount={pageCount}
            filters={filters}
          />
        </CardContent>
      </Card>
    </div>
  );
}
