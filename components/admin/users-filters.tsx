"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
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
  adminUsersHref,
  type AdminUserFilters,
} from "@/lib/admin-users";
import {
  ACCOUNT_TYPE_LABEL,
  ACCOUNT_TYPES,
  USER_ROLE_LABEL,
  USER_ROLES,
} from "@/types";

const selectTriggerClass = "h-8 md:h-8";

export function AdminUsersFilters({ filters }: { filters: AdminUserFilters }) {
  const router = useRouter();
  const [query, setQuery] = useState(filters.q ?? "");

  useEffect(() => {
    setQuery(filters.q ?? "");
  }, [filters.q]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = query.trim();
      if (next === (filters.q ?? "")) return;
      router.push(
        adminUsersHref({
          ...filters,
          q: next || undefined,
          unverifiedDealers: false,
          page: 1,
        }),
      );
    }, 400);
    return () => window.clearTimeout(handle);
  }, [filters, query, router]);

  function patch(next: Partial<AdminUserFilters>) {
    router.push(
      adminUsersHref({
        ...filters,
        ...next,
        unverifiedDealers: false,
        page: 1,
      }),
    );
  }

  const hasFilters = Boolean(
    filters.q ||
      filters.role ||
      filters.accountType ||
      filters.status ||
      filters.from ||
      filters.to ||
      filters.unverifiedDealers,
  );

  return (
    <div className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-6">
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="admin-user-search" className="text-xs text-muted-foreground">
          Search
        </Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="admin-user-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name or email"
            className="h-8 pl-8 md:text-sm"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Role</Label>
        <Select
          value={filters.role ?? "all"}
          onValueChange={(value) =>
            patch({ role: value === "all" ? undefined : (value as AdminUserFilters["role"]) })
          }
        >
          <SelectTrigger className={selectTriggerClass} aria-label="Filter by role">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {USER_ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {USER_ROLE_LABEL[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Account type</Label>
        <Select
          value={filters.unverifiedDealers ? "unverified" : (filters.accountType ?? "all")}
          onValueChange={(value) => {
            if (value === "unverified") {
              router.push(
                adminUsersHref({
                  ...filters,
                  accountType: "dealer",
                  unverifiedDealers: true,
                  page: 1,
                }),
              );
              return;
            }
            patch({
              accountType: value === "all" ? undefined : (value as AdminUserFilters["accountType"]),
            });
          }}
        >
          <SelectTrigger className={selectTriggerClass} aria-label="Filter by account type">
            <SelectValue placeholder="All accounts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All accounts</SelectItem>
            {ACCOUNT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {ACCOUNT_TYPE_LABEL[type]}
              </SelectItem>
            ))}
            <SelectItem value="unverified">Unverified dealers</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Status</Label>
        <Select
          value={filters.status ?? "all"}
          onValueChange={(value) =>
            patch({
              status: value === "all" ? undefined : (value as AdminUserFilters["status"]),
            })
          }
        >
          <SelectTrigger className={selectTriggerClass} aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="admin-user-from" className="text-xs text-muted-foreground">
          Signed up from
        </Label>
        <Input
          id="admin-user-from"
          type="date"
          value={filters.from ?? ""}
          onChange={(event) => patch({ from: event.target.value || undefined })}
          className="h-8 md:text-sm"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="admin-user-to" className="text-xs text-muted-foreground">
          Signed up to
        </Label>
        <Input
          id="admin-user-to"
          type="date"
          value={filters.to ?? ""}
          onChange={(event) => patch({ to: event.target.value || undefined })}
          className="h-8 md:text-sm"
        />
      </div>

      {hasFilters ? (
        <div className="flex items-end sm:col-span-2 xl:col-span-6">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => router.push("/admin/users")}
          >
            <X className="size-3.5" />
            Clear filters
          </Button>
        </div>
      ) : null}
    </div>
  );
}
