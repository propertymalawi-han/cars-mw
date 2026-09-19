import { Prisma, type AccountType, type UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ACCOUNT_TYPES,
  USER_ROLES,
  type AccountType as AppAccountType,
  type UserRole as AppUserRole,
} from "@/types";

export const ADMIN_USERS_PAGE_SIZE = 20;

export const ADMIN_USER_TABS = ["profile", "listings", "activity", "actions"] as const;
export type AdminUserTab = (typeof ADMIN_USER_TABS)[number];

export type AdminUserStatus = "active" | "suspended";

export type AdminUserFilters = {
  q?: string;
  role?: AppUserRole;
  accountType?: AppAccountType;
  status?: AdminUserStatus;
  from?: string;
  to?: string;
  unverifiedDealers?: boolean;
  page: number;
};

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: UserRole;
  accountType: AccountType;
  createdAt: string;
  listingsCount: number;
  lastActiveAt: string | null;
  suspended: boolean;
};

export type AdminUserDealer = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  districts: string[];
  verified: boolean;
  phone: string;
  whatsapp: string;
  description: string;
  createdAt: string;
};

export type AdminUserDetail = AdminUserRow & {
  phone: string | null;
  emailVerified: string | null;
  suspendedReason: string | null;
  suspendedAt: string | null;
  dealer: AdminUserDealer | null;
};

export type AdminUserActivityKind = "login" | "listing" | "enquiry" | "favourite";

export type AdminUserActivityItem = {
  id: string;
  kind: AdminUserActivityKind;
  at: string;
  title: string;
  detail?: string;
  href?: string;
};

type SearchParamValue = string | string[] | undefined;

function first(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

function isRole(value: string | undefined): value is AppUserRole {
  return USER_ROLES.includes(value as AppUserRole);
}

function isAccountType(value: string | undefined): value is AppAccountType {
  return ACCOUNT_TYPES.includes(value as AppAccountType);
}

function isStatus(value: string | undefined): value is AdminUserStatus {
  return value === "active" || value === "suspended";
}

function isDateParam(value: string | undefined) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export function isAdminUserTab(value: string | undefined): value is AdminUserTab {
  return ADMIN_USER_TABS.includes(value as AdminUserTab);
}

export function parseAdminUserSearchParams(
  searchParams: Record<string, SearchParamValue> = {},
): AdminUserFilters {
  const q = first(searchParams.q)?.trim() || undefined;
  const roleRaw = first(searchParams.role)?.trim();
  const accountRaw = first(searchParams.accountType)?.trim();
  const statusRaw = first(searchParams.status)?.trim();
  const from = first(searchParams.from)?.trim();
  const to = first(searchParams.to)?.trim();
  const pageRaw = Number(first(searchParams.page) ?? "1");
  const unverifiedDealers = first(searchParams.filter)?.trim() === "unverified-dealers";

  return {
    q,
    role: isRole(roleRaw) ? roleRaw : undefined,
    accountType: unverifiedDealers
      ? "dealer"
      : isAccountType(accountRaw)
        ? accountRaw
        : undefined,
    status: isStatus(statusRaw) ? statusRaw : undefined,
    from: isDateParam(from) ? from : undefined,
    to: isDateParam(to) ? to : undefined,
    unverifiedDealers,
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1,
  };
}

export function adminUsersHref(filters: Partial<AdminUserFilters> & Pick<AdminUserFilters, "page">) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.role) params.set("role", filters.role);
  if (filters.accountType && !filters.unverifiedDealers) {
    params.set("accountType", filters.accountType);
  }
  if (filters.status) params.set("status", filters.status);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.unverifiedDealers) params.set("filter", "unverified-dealers");
  if (filters.page > 1) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `/admin/users?${query}` : "/admin/users";
}

export function adminUserHref(userId: string, tab?: AdminUserTab) {
  if (!tab || tab === "profile") return `/admin/users/${userId}`;
  return `/admin/users/${userId}?tab=${tab}`;
}

function endOfDay(date: string) {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + 1);
  return next;
}

function userWhere(filters: AdminUserFilters): Prisma.UserWhereInput {
  const clauses: Prisma.UserWhereInput[] = [];

  if (filters.role) clauses.push({ role: filters.role });
  if (filters.accountType) clauses.push({ accountType: filters.accountType });
  if (filters.status === "suspended") clauses.push({ suspended: true });
  if (filters.status === "active") clauses.push({ suspended: false });
  if (filters.unverifiedDealers) {
    clauses.push({ dealer: { is: { verified: false } } });
  }
  if (filters.from) {
    clauses.push({ createdAt: { gte: new Date(`${filters.from}T00:00:00`) } });
  }
  if (filters.to) {
    clauses.push({ createdAt: { lt: endOfDay(filters.to) } });
  }

  const search = filters.q?.replace(/[%_,]/g, " ").trim();
  if (search) {
    clauses.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  return clauses.length > 0 ? { AND: clauses } : {};
}

async function lastActiveByUserIds(ids: string[]) {
  const map = new Map<string, Date>();
  if (ids.length === 0) return map;

  try {
    const rows = await prisma.$queryRaw<Array<{ id: string; last_active_at: Date | null }>>`
      SELECT
        u.id,
        GREATEST(
          au.last_sign_in_at,
          (
            SELECT MAX(listings.created_at)
            FROM listings
            WHERE listings.seller_id = u.id AND listings.deleted_at IS NULL
          ),
          (
            SELECT MAX(view_history.viewed_at)
            FROM view_history
            WHERE view_history.user_id = u.id
          ),
          (
            SELECT MAX(favourites.created_at)
            FROM favourites
            WHERE favourites.user_id = u.id
          ),
          (
            SELECT MAX(enquiries.created_at)
            FROM enquiries
            WHERE enquiries.user_id = u.id
          )
        ) AS last_active_at
      FROM users u
      LEFT JOIN auth.users au ON au.id = u.id
      WHERE u.id::text IN (${Prisma.join(ids)})
    `;
    for (const row of rows) {
      if (row.last_active_at) map.set(row.id, row.last_active_at);
    }
  } catch (error) {
    console.error("Failed to load last active times", error);
  }

  return map;
}

function toUserRow(
  row: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    role: UserRole;
    accountType: AccountType;
    createdAt: Date;
    suspended: boolean;
    _count: { listings: number };
  },
  lastActive: Date | undefined,
): AdminUserRow {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatarUrl,
    role: row.role,
    accountType: row.accountType,
    createdAt: row.createdAt.toISOString(),
    listingsCount: row._count.listings,
    lastActiveAt: lastActive?.toISOString() ?? null,
    suspended: row.suspended,
  };
}

const userListSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  role: true,
  accountType: true,
  createdAt: true,
  suspended: true,
  _count: { select: { listings: { where: { deletedAt: null } } } },
} satisfies Prisma.UserSelect;

export async function getAdminUsers(filters: AdminUserFilters) {
  const where = userWhere(filters);
  const skip = (filters.page - 1) * ADMIN_USERS_PAGE_SIZE;

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: ADMIN_USERS_PAGE_SIZE,
      select: userListSelect,
    }),
    prisma.user.count({ where }),
  ]);

  const lastActive = await lastActiveByUserIds(rows.map((row) => row.id));
  const users = rows.map((row) => toUserRow(row, lastActive.get(row.id)));
  const pageCount = Math.max(1, Math.ceil(total / ADMIN_USERS_PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);

  return { users, total, pageCount, page };
}

export async function getPendingDealerVerifications() {
  return prisma.dealer.findMany({
    where: { verified: false },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      slug: true,
      phone: true,
      createdAt: true,
      user: { select: { id: true, email: true, name: true } },
    },
  });
}

export async function getAdminUser(id: string): Promise<AdminUserDetail | null> {
  const row = await prisma.user.findUnique({
    where: { id },
    select: {
      ...userListSelect,
      phone: true,
      emailVerified: true,
      suspendedReason: true,
      suspendedAt: true,
      dealer: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          districts: true,
          verified: true,
          phone: true,
          whatsapp: true,
          description: true,
          createdAt: true,
        },
      },
    },
  });
  if (!row) return null;

  const lastActive = await lastActiveByUserIds([row.id]);
  const base = toUserRow(row, lastActive.get(row.id));

  return {
    ...base,
    phone: row.phone,
    emailVerified: row.emailVerified?.toISOString() ?? null,
    suspendedReason: row.suspendedReason,
    suspendedAt: row.suspendedAt?.toISOString() ?? null,
    dealer: row.dealer
      ? {
          id: row.dealer.id,
          name: row.dealer.name,
          slug: row.dealer.slug,
          logoUrl: row.dealer.logoUrl,
          districts: row.dealer.districts,
          verified: row.dealer.verified,
          phone: row.dealer.phone,
          whatsapp: row.dealer.whatsapp,
          description: row.dealer.description,
          createdAt: row.dealer.createdAt.toISOString(),
        }
      : null,
  };
}

export async function getAdminUserActivity(userId: string): Promise<AdminUserActivityItem[]> {
  const [listings, enquiries, favourites, logins] = await Promise.all([
    prisma.listing.findMany({
      where: { sellerId: userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, title: true, make: true, model: true, year: true, createdAt: true },
    }),
    prisma.enquiry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        createdAt: true,
        listing: { select: { id: true, title: true, make: true, model: true, year: true } },
      },
    }),
    prisma.favourite.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        createdAt: true,
        listing: { select: { id: true, title: true, make: true, model: true, year: true } },
      },
    }),
    getAuthSessions(userId),
  ]);

  const items: AdminUserActivityItem[] = [
    ...listings.map((listing) => ({
      id: `listing-${listing.id}`,
      kind: "listing" as const,
      at: listing.createdAt.toISOString(),
      title: "Posted a listing",
      detail: listing.title || `${listing.year} ${listing.make} ${listing.model}`,
      href: `/listings/${listing.id}`,
    })),
    ...enquiries.map((enquiry) => ({
      id: `enquiry-${enquiry.id}`,
      kind: "enquiry" as const,
      at: enquiry.createdAt.toISOString(),
      title: "Sent an enquiry",
      detail: enquiry.listing.title || `${enquiry.listing.year} ${enquiry.listing.make} ${enquiry.listing.model}`,
      href: `/listings/${enquiry.listing.id}`,
    })),
    ...favourites.map((favourite) => ({
      id: `favourite-${favourite.id}`,
      kind: "favourite" as const,
      at: favourite.createdAt.toISOString(),
      title: "Saved a favourite",
      detail: favourite.listing.title || `${favourite.listing.year} ${favourite.listing.make} ${favourite.listing.model}`,
      href: `/listings/${favourite.listing.id}`,
    })),
    ...logins.map((login) => ({
      id: `login-${login.id}`,
      kind: "login" as const,
      at: login.at.toISOString(),
      title: "Signed in",
      detail: login.detail,
    })),
  ];

  return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 50);
}

async function getAuthSessions(userId: string) {
  try {
    const rows = await prisma.$queryRaw<
      Array<{
        id: string;
        created_at: Date;
        refreshed_at: Date | null;
        user_agent: string | null;
        ip: string | null;
      }>
    >`
      SELECT id::text, created_at, refreshed_at, user_agent, host(ip)::text AS ip
      FROM auth.sessions
      WHERE user_id = ${userId}::uuid
      ORDER BY COALESCE(refreshed_at, created_at) DESC
      LIMIT 20
    `;

    return rows.map((row) => {
      const at = row.refreshed_at ?? row.created_at;
      const parts = [row.ip, row.user_agent].filter(Boolean);
      return {
        id: row.id,
        at,
        detail: parts.length > 0 ? parts.join(" · ") : undefined,
      };
    });
  } catch (error) {
    console.error("Failed to load sign-in history", error);
    return [];
  }
}
