import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const ADMIN_AUDIT_LOG_PAGE_SIZE = 20;

export const ADMIN_AUDIT_ACTIONS = [
  "listing.mute",
  "listing.unmute",
  "listing.delete",
  "listing.feature",
  "listing.unfeature",
  "user.suspend",
  "user.reactivate",
  "user.password_reset",
  "dealer.verify",
  "dealer.unverify",
  "category.create",
  "category.update",
  "category.mute",
  "category.unmute",
  "category.delete",
  "make.create",
  "make.update",
  "make.mute",
  "make.unmute",
  "make.delete",
  "model.create",
  "model.update",
  "model.mute",
  "model.unmute",
  "model.delete",
  "variant.create",
  "variant.update",
  "variant.delete",
] as const;

export type AdminAuditAction = (typeof ADMIN_AUDIT_ACTIONS)[number];

export const ADMIN_AUDIT_ACTION_LABEL: Record<string, string> = {
  "listing.mute": "Listing · Mute",
  "listing.unmute": "Listing · Unmute",
  "listing.delete": "Listing · Delete",
  "listing.feature": "Listing · Feature",
  "listing.unfeature": "Listing · Unfeature",
  "user.suspend": "User · Suspend",
  "user.reactivate": "User · Reactivate",
  "user.password_reset": "User · Password reset",
  "dealer.verify": "Dealer · Verify",
  "dealer.unverify": "Dealer · Unverify",
  "category.create": "Category · Create",
  "category.update": "Category · Update",
  "category.mute": "Category · Mute",
  "category.unmute": "Category · Unmute",
  "category.delete": "Category · Delete",
  "make.create": "Make · Create",
  "make.update": "Make · Update",
  "make.mute": "Make · Mute",
  "make.unmute": "Make · Unmute",
  "make.delete": "Make · Delete",
  "model.create": "Model · Create",
  "model.update": "Model · Update",
  "model.mute": "Model · Mute",
  "model.unmute": "Model · Unmute",
  "model.delete": "Model · Delete",
  "variant.create": "Variant · Create",
  "variant.update": "Variant · Update",
  "variant.delete": "Variant · Delete",
};

export const ADMIN_AUDIT_TARGET_LABEL: Record<string, string> = {
  listing: "Listing",
  user: "User",
  dealer: "Dealer",
  vehicle_category: "Category",
  make: "Make",
  model: "Model",
  variant: "Variant",
};

export type AdminAuditLogFilters = {
  adminUserId?: string;
  action?: string;
  from?: string;
  to?: string;
  page: number;
};

export type AdminAuditLogAdminOption = {
  id: string;
  name: string;
  email: string;
};

export type AdminAuditLogRow = {
  id: string;
  createdAt: string;
  action: string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  targetHref: string | null;
  metadata: Record<string, unknown>;
  admin: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
};

type SearchParamValue = string | string[] | undefined;

function first(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

function isDateParam(value: string | undefined) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function isUuid(value: string | undefined) {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value),
  );
}

function vehicleDataTargetHref(tab: "categories" | "makes" | "models", makeId?: string) {
  const params = new URLSearchParams();
  if (tab !== "categories") params.set("tab", tab);
  if (tab === "models" && makeId) params.set("makeId", makeId);
  const query = params.toString();
  return query ? `/admin/vehicle-data?${query}` : "/admin/vehicle-data";
}

function endOfDay(date: string) {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + 1);
  return next;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

export function metadataString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function parseAdminAuditLogSearchParams(
  searchParams: Record<string, SearchParamValue> = {},
): AdminAuditLogFilters {
  const adminUserId = first(searchParams.admin)?.trim();
  const action = first(searchParams.action)?.trim();
  const from = first(searchParams.from)?.trim();
  const to = first(searchParams.to)?.trim();
  const pageRaw = Number(first(searchParams.page) ?? "1");

  return {
    adminUserId: isUuid(adminUserId) ? adminUserId : undefined,
    action: action || undefined,
    from: isDateParam(from) ? from : undefined,
    to: isDateParam(to) ? to : undefined,
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1,
  };
}

export function adminAuditLogHref(
  filters: Partial<AdminAuditLogFilters> & Pick<AdminAuditLogFilters, "page">,
) {
  const params = new URLSearchParams();
  if (filters.adminUserId) params.set("admin", filters.adminUserId);
  if (filters.action) params.set("action", filters.action);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.page > 1) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `/admin/audit-log?${query}` : "/admin/audit-log";
}

export function auditActionLabel(action: string) {
  if (ADMIN_AUDIT_ACTION_LABEL[action]) return ADMIN_AUDIT_ACTION_LABEL[action];
  return action
    .split(".")
    .map((part) => part.replace(/_/g, " "))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" · ");
}

export function auditActionVariant(
  action: string,
): "destructive" | "success" | "secondary" | "outline" {
  const verb = action.split(".").at(-1);
  if (verb === "delete" || verb === "suspend") return "destructive";
  if (
    verb === "create" ||
    verb === "verify" ||
    verb === "feature" ||
    verb === "reactivate" ||
    verb === "unmute"
  ) {
    return "success";
  }
  if (verb === "mute" || verb === "unverify" || verb === "unfeature") {
    return "secondary";
  }
  return "outline";
}

export function auditTargetTypeLabel(targetType: string) {
  return ADMIN_AUDIT_TARGET_LABEL[targetType] ?? titleCaseToken(targetType);
}

function titleCaseToken(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function nestedRecord(metadata: Record<string, unknown>, key: string) {
  return asRecord(metadata[key]);
}

function firstMetadataString(
  metadata: Record<string, unknown>,
  keys: string[],
) {
  for (const key of keys) {
    const direct = metadataString(metadata, key);
    if (direct) return direct;
    const after = metadataString(nestedRecord(metadata, "after"), key);
    if (after) return after;
    const before = metadataString(nestedRecord(metadata, "before"), key);
    if (before) return before;
  }
  return undefined;
}

export function auditTargetLabel(
  targetType: string,
  targetId: string,
  metadata: Record<string, unknown>,
) {
  const name = firstMetadataString(metadata, [
    "title",
    "name",
    "dealerName",
    "email",
  ]);
  if (name) return name;

  const makeName = firstMetadataString(metadata, ["makeName"]);
  const modelName = firstMetadataString(metadata, ["modelName"]);
  if (makeName && modelName) return `${makeName} ${modelName}`;
  if (makeName) return makeName;

  return targetId;
}

export function auditTargetHref(
  targetType: string,
  targetId: string,
  metadata: Record<string, unknown>,
) {
  switch (targetType) {
    case "listing":
      return `/listings/${targetId}`;
    case "user":
      return `/admin/users/${targetId}`;
    case "dealer": {
      const userId = metadataString(metadata, "userId");
      return userId ? `/admin/users/${userId}` : null;
    }
    case "vehicle_category":
      return vehicleDataTargetHref("categories");
    case "make":
      return vehicleDataTargetHref("makes");
    case "model": {
      const makeId =
        metadataString(metadata, "makeId") ??
        metadataString(nestedRecord(metadata, "after"), "makeId") ??
        metadataString(nestedRecord(metadata, "before"), "makeId");
      return vehicleDataTargetHref("models", makeId);
    }
    case "variant": {
      const makeId =
        metadataString(metadata, "makeId") ??
        metadataString(nestedRecord(metadata, "after"), "makeId") ??
        metadataString(nestedRecord(metadata, "before"), "makeId");
      return vehicleDataTargetHref("models", makeId);
    }
    default:
      return null;
  }
}

function auditWhere(filters: AdminAuditLogFilters): Prisma.AdminAuditLogWhereInput {
  const clauses: Prisma.AdminAuditLogWhereInput[] = [];

  if (filters.adminUserId) clauses.push({ adminUserId: filters.adminUserId });
  if (filters.action) clauses.push({ action: filters.action });
  if (filters.from) {
    clauses.push({ createdAt: { gte: new Date(`${filters.from}T00:00:00`) } });
  }
  if (filters.to) {
    clauses.push({ createdAt: { lt: endOfDay(filters.to) } });
  }

  return clauses.length > 0 ? { AND: clauses } : {};
}

function toMetadata(value: Prisma.JsonValue): Record<string, unknown> {
  return asRecord(value);
}

export async function getAdminAuditLogOptions(): Promise<{
  admins: AdminAuditLogAdminOption[];
  actions: string[];
}> {
  const [admins, actionRows] = await Promise.all([
    prisma.user.findMany({
      where: {
        OR: [
          { role: { in: ["admin", "support"] } },
          { adminAuditLogs: { some: {} } },
        ],
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.adminAuditLog.groupBy({
      by: ["action"],
      orderBy: { action: "asc" },
    }),
  ]);

  const actions: string[] = [...ADMIN_AUDIT_ACTIONS];
  const seen = new Set(actions);
  for (const row of actionRows) {
    if (!seen.has(row.action)) {
      seen.add(row.action);
      actions.push(row.action);
    }
  }

  return { admins, actions };
}

export async function getAdminAuditLogs(filters: AdminAuditLogFilters) {
  const where = auditWhere(filters);
  const skip = (filters.page - 1) * ADMIN_AUDIT_LOG_PAGE_SIZE;

  const [rows, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: ADMIN_AUDIT_LOG_PAGE_SIZE,
      select: {
        id: true,
        action: true,
        targetType: true,
        targetId: true,
        metadata: true,
        createdAt: true,
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    }),
    prisma.adminAuditLog.count({ where }),
  ]);

  const entries: AdminAuditLogRow[] = rows.map((row) => {
    const metadata = toMetadata(row.metadata);
    return {
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      action: row.action,
      targetType: row.targetType,
      targetId: row.targetId,
      targetLabel: auditTargetLabel(row.targetType, row.targetId, metadata),
      targetHref: auditTargetHref(row.targetType, row.targetId, metadata),
      metadata,
      admin: row.admin,
    };
  });

  const pageCount = Math.max(1, Math.ceil(total / ADMIN_AUDIT_LOG_PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);

  return { entries, total, pageCount, page };
}
