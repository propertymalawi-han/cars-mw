import Link from "next/link";
import { AdminUserAvatar } from "@/components/admin/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ADMIN_USERS_PAGE_SIZE,
  adminUsersHref,
  type AdminUserFilters,
  type AdminUserRow,
} from "@/lib/admin-users";
import { formatNumber } from "@/lib/currency";
import { formatDate } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import { ACCOUNT_TYPE_LABEL, USER_ROLE_LABEL } from "@/types";

export function AdminUsersDataTable({
  users,
  total,
  pageCount,
  filters,
}: {
  users: AdminUserRow[];
  total: number;
  pageCount: number;
  filters: AdminUserFilters;
}) {
  const page = Math.min(Math.max(filters.page, 1), pageCount);
  const from = total === 0 ? 0 : (page - 1) * ADMIN_USERS_PAGE_SIZE + 1;
  const to = Math.min(page * ADMIN_USERS_PAGE_SIZE, total);

  return (
    <div className="space-y-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="h-9 w-12">
              <span className="sr-only">Avatar</span>
            </TableHead>
            <TableHead className="h-9">Name</TableHead>
            <TableHead className="h-9">Email</TableHead>
            <TableHead className="h-9">Role</TableHead>
            <TableHead className="h-9">Account type</TableHead>
            <TableHead className="h-9">Signed up</TableHead>
            <TableHead className="h-9 text-right">Listings</TableHead>
            <TableHead className="h-9">Last active</TableHead>
            <TableHead className="h-9">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                No users match these filters.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id} className="cursor-pointer hover:bg-muted/40">
                <TableCell className="py-2">
                  <Link href={`/admin/users/${user.id}`} className="inline-flex">
                    <AdminUserAvatar
                      src={user.avatarUrl}
                      name={user.name}
                      email={user.email}
                      className="size-8"
                    />
                    <span className="sr-only">{user.name}</span>
                  </Link>
                </TableCell>
                <TableCell className="max-w-[14rem] py-2 font-medium">
                  <Link href={`/admin/users/${user.id}`} className="hover:text-copper">
                    {user.name}
                  </Link>
                </TableCell>
                <TableCell className="max-w-[16rem] py-2">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="block truncate text-muted-foreground hover:text-foreground"
                  >
                    {user.email}
                  </Link>
                </TableCell>
                <TableCell className="py-2">
                  <Link href={`/admin/users/${user.id}`}>
                    <Badge variant="secondary">{USER_ROLE_LABEL[user.role]}</Badge>
                  </Link>
                </TableCell>
                <TableCell className="py-2">
                  <Link href={`/admin/users/${user.id}`}>
                    {ACCOUNT_TYPE_LABEL[user.accountType]}
                  </Link>
                </TableCell>
                <TableCell className="whitespace-nowrap py-2 text-muted-foreground">
                  <Link href={`/admin/users/${user.id}`}>{formatDate(user.createdAt)}</Link>
                </TableCell>
                <TableCell className="py-2 text-right tabular-nums">
                  <Link href={`/admin/users/${user.id}?tab=listings`}>
                    {formatNumber(user.listingsCount)}
                  </Link>
                </TableCell>
                <TableCell className="whitespace-nowrap py-2 text-muted-foreground">
                  <Link href={`/admin/users/${user.id}`}>
                    {user.lastActiveAt ? formatDate(user.lastActiveAt) : "—"}
                  </Link>
                </TableCell>
                <TableCell className="py-2">
                  <Link href={`/admin/users/${user.id}`}>
                    <Badge variant={user.suspended ? "destructive" : "success"}>
                      {user.suspended ? "Suspended" : "Active"}
                    </Badge>
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="flex flex-col gap-2 border-t px-3 py-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          {total === 0
            ? "0 users"
            : `Showing ${formatNumber(from)}–${formatNumber(to)} of ${formatNumber(total)}`}
        </p>
        {pageCount > 1 ? (
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className={cn("h-8", page <= 1 && "pointer-events-none opacity-50")}
            >
              <Link
                href={adminUsersHref({ ...filters, page: Math.max(1, page - 1) })}
                aria-disabled={page <= 1}
              >
                Previous
              </Link>
            </Button>
            <span className="tabular-nums">
              Page {page} of {pageCount}
            </span>
            <Button
              asChild
              variant="outline"
              size="sm"
              className={cn("h-8", page >= pageCount && "pointer-events-none opacity-50")}
            >
              <Link
                href={adminUsersHref({ ...filters, page: Math.min(pageCount, page + 1) })}
                aria-disabled={page >= pageCount}
              >
                Next
              </Link>
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
