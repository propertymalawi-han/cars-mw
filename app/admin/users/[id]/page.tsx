import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminListingsDataTable } from "@/components/admin/listings-data-table";
import { AdminListingsFilters } from "@/components/admin/listings-filters";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminDealerVerifyToggle, AdminUserActions } from "@/components/admin/user-actions";
import { AdminUserAvatar } from "@/components/admin/user-avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getAdminListings,
  parseAdminListingSearchParams,
  type AdminListingsHrefContext,
} from "@/lib/admin-listings";
import {
  adminUserHref,
  getAdminUser,
  getAdminUserActivity,
  isAdminUserTab,
  type AdminUserActivityItem,
  type AdminUserTab,
} from "@/lib/admin-users";
import { formatNumber } from "@/lib/currency";
import { formatDate, formatDateTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import { ACCOUNT_TYPE_LABEL, USER_ROLE_LABEL } from "@/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const TABS: { id: AdminUserTab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "listings", label: "Listings" },
  { id: "activity", label: "Activity" },
  { id: "actions", label: "Actions" },
];

const ACTIVITY_LABEL: Record<AdminUserActivityItem["kind"], string> = {
  login: "Login",
  listing: "Listing",
  enquiry: "Enquiry",
  favourite: "Favourite",
};

export const metadata: Metadata = {
  title: "User",
};

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  if (!UUID_RE.test(params.id)) notFound();

  const user = await getAdminUser(params.id);
  if (!user) notFound();

  const tabRaw = Array.isArray(searchParams?.tab) ? searchParams?.tab[0] : searchParams?.tab;
  const tab: AdminUserTab = isAdminUserTab(tabRaw) ? tabRaw : "profile";

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Link
          href="/admin/users"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Users
        </Link>
        <div className="flex flex-wrap items-start gap-3">
          <AdminUserAvatar
            src={user.avatarUrl}
            name={user.name}
            email={user.email}
            className="size-12"
          />
          <div className="min-w-0 flex-1 space-y-1">
            <AdminPageHeader title={user.name} description={user.email} />
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary">{USER_ROLE_LABEL[user.role]}</Badge>
              <Badge variant="outline">{ACCOUNT_TYPE_LABEL[user.accountType]}</Badge>
              <Badge variant={user.suspended ? "destructive" : "success"}>
                {user.suspended ? "Suspended" : "Active"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
        {TABS.map((item) => (
          <Link
            key={item.id}
            href={adminUserHref(user.id, item.id)}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium",
              tab === item.id && "bg-background text-foreground shadow",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {tab === "profile" ? <ProfileTab user={user} /> : null}
      {tab === "listings" ? (
        <ListingsTab userId={user.id} searchParams={searchParams} />
      ) : null}
      {tab === "activity" ? <ActivityTab userId={user.id} /> : null}
      {tab === "actions" ? (
        <Card className="shadow-none">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-[13px] font-medium">Account actions</CardTitle>
            <CardDescription>
              Suspension does not mute existing listings. Password reset uses the user’s email.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <AdminUserActions user={user} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function ProfileTab({
  user,
}: {
  user: NonNullable<Awaited<ReturnType<typeof getAdminUser>>>;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="shadow-none">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-[13px] font-medium">Account</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 p-3 pt-0 sm:grid-cols-2">
          <Field label="Name" value={user.name} />
          <Field label="Email" value={user.email} />
          <Field label="Phone" value={user.phone || "—"} />
          <Field label="Role" value={USER_ROLE_LABEL[user.role]} />
          <Field label="Account type" value={ACCOUNT_TYPE_LABEL[user.accountType]} />
          <Field
            label="Email verified"
            value={user.emailVerified ? formatDateTime(user.emailVerified) : "Not verified"}
          />
          <Field label="Signed up" value={formatDateTime(user.createdAt)} />
          <Field
            label="Last active"
            value={user.lastActiveAt ? formatDateTime(user.lastActiveAt) : "—"}
          />
          <Field label="Listings" value={formatNumber(user.listingsCount)} />
          <Field label="Status" value={user.suspended ? "Suspended" : "Active"} />
          {user.suspended ? (
            <>
              <Field
                label="Suspended"
                value={user.suspendedAt ? formatDateTime(user.suspendedAt) : "—"}
              />
              <Field label="Reason" value={user.suspendedReason || "—"} />
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-[13px] font-medium">Dealer profile</CardTitle>
          <CardDescription>
            {user.dealer
              ? "Verification is shown on the public dealership page."
              : "This account has no dealership profile."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-3 pt-0">
          {user.dealer ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Dealership" value={user.dealer.name} />
                <Field label="Slug" value={user.dealer.slug} />
                <Field label="Phone" value={user.dealer.phone} />
                <Field label="WhatsApp" value={user.dealer.whatsapp} />
                <Field
                  label="Districts"
                  value={user.dealer.districts.length > 0 ? user.dealer.districts.join(", ") : "—"}
                />
                <Field label="Created" value={formatDate(user.dealer.createdAt)} />
              </div>
              {user.dealer.description ? (
                <Field label="Description" value={user.dealer.description} />
              ) : null}
              <AdminDealerVerifyToggle
                userId={user.id}
                verified={user.dealer.verified}
                dealerName={user.dealer.name}
              />
              <p className="text-sm">
                <Link
                  href={`/dealers/${user.dealer.slug}`}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                  target="_blank"
                >
                  View public dealer page
                </Link>
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Individual accounts do not have a dealership record.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

async function ListingsTab({
  userId,
  searchParams,
}: {
  userId: string;
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const filters = {
    ...parseAdminListingSearchParams(searchParams),
    sellerId: userId,
  };
  const { listings, total, pageCount } = await getAdminListings(filters);
  const hrefContext: AdminListingsHrefContext = {
    pathname: `/admin/users/${userId}`,
    extra: { tab: "listings" },
    omit: ["sellerId"],
  };

  return (
    <Card className="shadow-none">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-[13px] font-medium">Listings</CardTitle>
        <CardDescription>
          {formatNumber(total)} listing{total === 1 ? "" : "s"} posted by this user.
        </CardDescription>
      </CardHeader>
      <AdminListingsFilters filters={filters} hrefContext={hrefContext} />
      <CardContent className="p-0">
        <AdminListingsDataTable
          listings={listings}
          total={total}
          pageCount={pageCount}
          filters={filters}
          hrefContext={hrefContext}
        />
      </CardContent>
    </Card>
  );
}

async function ActivityTab({ userId }: { userId: string }) {
  const items = await getAdminUserActivity(userId);

  return (
    <Card className="shadow-none">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-[13px] font-medium">Recent activity</CardTitle>
        <CardDescription>
          Sign-ins, listings posted, enquiries sent, and favourites.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            No recent activity for this user.
          </p>
        ) : (
          <ol className="divide-y">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-3 px-3 py-3">
                <Badge variant="secondary" className="mt-0.5 shrink-0">
                  {ACTIVITY_LABEL[item.kind]}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  {item.detail ? (
                    item.href ? (
                      <Link
                        href={item.href}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        {item.detail}
                      </Link>
                    ) : (
                      <p className="truncate text-sm text-muted-foreground">{item.detail}</p>
                    )
                  ) : null}
                </div>
                <p className="shrink-0 text-xs text-muted-foreground">
                  {formatDateTime(item.at)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
