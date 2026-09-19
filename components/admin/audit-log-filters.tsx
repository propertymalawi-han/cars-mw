"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  adminAuditLogHref,
  auditActionLabel,
  type AdminAuditLogAdminOption,
  type AdminAuditLogFilters,
} from "@/lib/admin-audit-log";

const selectTriggerClass = "h-8 md:h-8";

export function AdminAuditLogFilters({
  filters,
  admins,
  actions,
}: {
  filters: AdminAuditLogFilters;
  admins: AdminAuditLogAdminOption[];
  actions: string[];
}) {
  const router = useRouter();

  function patch(next: Partial<AdminAuditLogFilters>) {
    router.push(
      adminAuditLogHref({
        ...filters,
        ...next,
        page: 1,
      }),
    );
  }

  const hasFilters = Boolean(
    filters.adminUserId || filters.action || filters.from || filters.to,
  );

  return (
    <div className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-4">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Admin</Label>
        <Select
          value={filters.adminUserId ?? "all"}
          onValueChange={(value) =>
            patch({ adminUserId: value === "all" ? undefined : value })
          }
        >
          <SelectTrigger className={selectTriggerClass} aria-label="Filter by admin">
            <SelectValue placeholder="All admins" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All admins</SelectItem>
            {admins.map((admin) => (
              <SelectItem key={admin.id} value={admin.id}>
                {admin.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Action</Label>
        <Select
          value={filters.action ?? "all"}
          onValueChange={(value) =>
            patch({ action: value === "all" ? undefined : value })
          }
        >
          <SelectTrigger className={selectTriggerClass} aria-label="Filter by action">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {actions.map((action) => (
              <SelectItem key={action} value={action}>
                {auditActionLabel(action)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="admin-audit-from" className="text-xs text-muted-foreground">
          From
        </Label>
        <Input
          id="admin-audit-from"
          type="date"
          value={filters.from ?? ""}
          onChange={(event) => patch({ from: event.target.value || undefined })}
          className="h-8 md:text-sm"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="admin-audit-to" className="text-xs text-muted-foreground">
          To
        </Label>
        <Input
          id="admin-audit-to"
          type="date"
          value={filters.to ?? ""}
          onChange={(event) => patch({ to: event.target.value || undefined })}
          className="h-8 md:text-sm"
        />
      </div>

      {hasFilters ? (
        <div className="flex items-end sm:col-span-2 xl:col-span-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => router.push("/admin/audit-log")}
          >
            <X className="size-3.5" />
            Clear filters
          </Button>
        </div>
      ) : null}
    </div>
  );
}
