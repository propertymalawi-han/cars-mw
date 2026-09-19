"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
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
  ADMIN_AUDIT_LOG_PAGE_SIZE,
  adminAuditLogHref,
  asRecord,
  auditActionLabel,
  auditActionVariant,
  auditTargetTypeLabel,
  type AdminAuditLogFilters,
  type AdminAuditLogRow,
} from "@/lib/admin-audit-log";
import { formatNumber } from "@/lib/currency";
import { formatDateTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";

export function AdminAuditLogTable({
  entries,
  total,
  pageCount,
  filters,
}: {
  entries: AdminAuditLogRow[];
  total: number;
  pageCount: number;
  filters: AdminAuditLogFilters;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const page = Math.min(Math.max(filters.page, 1), pageCount);
  const from = total === 0 ? 0 : (page - 1) * ADMIN_AUDIT_LOG_PAGE_SIZE + 1;
  const to = Math.min(page * ADMIN_AUDIT_LOG_PAGE_SIZE, total);

  return (
    <div className="space-y-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="h-9">When</TableHead>
            <TableHead className="h-9">Admin</TableHead>
            <TableHead className="h-9">Action</TableHead>
            <TableHead className="h-9">Target</TableHead>
            <TableHead className="h-9 w-20">
              <span className="sr-only">Details</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                No audit events match these filters.
              </TableCell>
            </TableRow>
          ) : (
            entries.map((entry) => {
              const open = openId === entry.id;
              return (
                <AuditLogRows
                  key={entry.id}
                  entry={entry}
                  open={open}
                  onToggle={() => setOpenId(open ? null : entry.id)}
                />
              );
            })
          )}
        </TableBody>
      </Table>

      <div className="flex flex-col gap-2 border-t px-3 py-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          {total === 0
            ? "0 events"
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
                href={adminAuditLogHref({ ...filters, page: Math.max(1, page - 1) })}
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
                href={adminAuditLogHref({ ...filters, page: Math.min(pageCount, page + 1) })}
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

function AuditLogRows({
  entry,
  open,
  onToggle,
}: {
  entry: AdminAuditLogRow;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <TableRow className={cn(open && "bg-muted/40 hover:bg-muted/40")}>
        <TableCell className="whitespace-nowrap py-2 text-muted-foreground">
          {formatDateTime(entry.createdAt)}
        </TableCell>
        <TableCell className="py-2">
          <div className="flex items-center gap-2">
            <AdminUserAvatar
              src={entry.admin.avatarUrl}
              name={entry.admin.name}
              email={entry.admin.email}
              className="size-7"
            />
            <div className="min-w-0">
              <p className="truncate font-medium">{entry.admin.name}</p>
              <p className="truncate text-xs text-muted-foreground">{entry.admin.email}</p>
            </div>
          </div>
        </TableCell>
        <TableCell className="py-2">
          <Badge variant={auditActionVariant(entry.action)}>
            {auditActionLabel(entry.action)}
          </Badge>
        </TableCell>
        <TableCell className="max-w-[18rem] py-2">
          <p className="text-xs text-muted-foreground">{auditTargetTypeLabel(entry.targetType)}</p>
          {entry.targetHref ? (
            <Link href={entry.targetHref} className="block truncate font-medium hover:text-copper">
              {entry.targetLabel}
            </Link>
          ) : (
            <p className="truncate font-medium">{entry.targetLabel}</p>
          )}
        </TableCell>
        <TableCell className="py-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            aria-expanded={open}
            onClick={onToggle}
          >
            Details
            <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
          </Button>
        </TableCell>
      </TableRow>
      {open ? (
        <TableRow className="bg-muted/20 hover:bg-muted/20">
          <TableCell colSpan={5} className="py-3">
            <AuditLogDetails metadata={entry.metadata} />
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}

function isDiffEntry(value: unknown): value is { from: unknown; to: unknown } {
  return (
    value != null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "from" in value &&
    "to" in value
  );
}

function AuditLogDetails({ metadata }: { metadata: Record<string, unknown> }) {
  const diffRecord = asRecord(metadata.diff);
  const diffEntries = Object.entries(diffRecord).filter(([, value]) => isDiffEntry(value)) as Array<
    [string, { from: unknown; to: unknown }]
  >;
  const rest = Object.fromEntries(
    Object.entries(metadata).filter(([key]) => key !== "diff" || diffEntries.length === 0),
  );
  const hasRest = Object.keys(rest).length > 0;
  const empty = diffEntries.length === 0 && !hasRest;

  if (empty) {
    return <p className="text-sm text-muted-foreground">No details recorded.</p>;
  }

  return (
    <div className="space-y-3">
      {diffEntries.length > 0 ? (
        <div className="overflow-hidden rounded-md border bg-card">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                <th className="px-3 py-1.5 font-medium">Field</th>
                <th className="px-3 py-1.5 font-medium">Before</th>
                <th className="px-3 py-1.5 font-medium">After</th>
              </tr>
            </thead>
            <tbody>
              {diffEntries.map(([field, change]) => (
                <tr key={field} className="border-b last:border-0">
                  <td className="px-3 py-1.5 font-mono text-muted-foreground">{field}</td>
                  <td className="px-3 py-1.5 font-mono">
                    <JsonValue value={change.from} />
                  </td>
                  <td className="px-3 py-1.5 font-mono">
                    <JsonValue value={change.to} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {hasRest ? (
        <pre className="max-h-64 overflow-auto rounded-md border bg-card p-3 font-mono text-xs leading-5">
          {JSON.stringify(rest, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

function JsonValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">null</span>;
  }
  if (typeof value === "string") return <span>{value || '""'}</span>;
  if (typeof value === "number" || typeof value === "boolean") {
    return <span>{String(value)}</span>;
  }
  return <span>{JSON.stringify(value)}</span>;
}
