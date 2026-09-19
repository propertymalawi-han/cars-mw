import type { Metadata } from "next";
import { AdminAuditLogFilters } from "@/components/admin/audit-log-filters";
import { AdminAuditLogTable } from "@/components/admin/audit-log-table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getAdminAuditLogOptions,
  getAdminAuditLogs,
  parseAdminAuditLogSearchParams,
} from "@/lib/admin-audit-log";
import { formatNumber } from "@/lib/currency";

export const metadata: Metadata = {
  title: "Audit Log",
};

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const filters = parseAdminAuditLogSearchParams(searchParams);
  const [{ entries, total, pageCount }, { admins, actions }] = await Promise.all([
    getAdminAuditLogs(filters),
    getAdminAuditLogOptions(),
  ]);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Audit Log"
        description="Read-only trail of staff actions on listings, users, and vehicle data."
      />
      <Card className="shadow-none">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-[13px] font-medium">Staff actions</CardTitle>
          <CardDescription>
            {formatNumber(total)} event{total === 1 ? "" : "s"} in this view.
          </CardDescription>
        </CardHeader>
        <AdminAuditLogFilters filters={filters} admins={admins} actions={actions} />
        <CardContent className="p-0">
          <AdminAuditLogTable
            entries={entries}
            total={total}
            pageCount={pageCount}
            filters={filters}
          />
        </CardContent>
      </Card>
    </div>
  );
}
