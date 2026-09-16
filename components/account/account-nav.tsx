"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ACCOUNT_ACTIVITY_LINKS,
  ACCOUNT_NAV_LINKS,
  ACCOUNT_SELLING_LINKS,
  ACCOUNT_SETTINGS_LINKS,
  isAccountNavActive,
} from "@/lib/account-nav";
import { cn } from "@/lib/utils";

function NavLink({
  href,
  label,
  icon: Icon,
  pathname,
  compact,
}: {
  href: string;
  label: string;
  icon: (typeof ACCOUNT_NAV_LINKS)[number]["icon"];
  pathname: string;
  compact?: boolean;
}) {
  const active = isAccountNavActive(pathname, href);
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-md text-sm font-medium transition-colors",
        compact
          ? "h-10 shrink-0 px-3"
          : "min-h-11 w-full px-3",
        active
          ? "bg-copper/10 text-copper"
          : "text-muted-foreground hover:bg-copper/10 hover:text-copper",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </Link>
  );
}

export function AccountSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isDealer = session?.user?.accountType === "dealer";
  const sellingLinks = isDealer ? [] : ACCOUNT_SELLING_LINKS;

  return (
    <aside className="hidden w-56 shrink-0 nav:block">
      <nav className="sticky top-24 space-y-6">
        {sellingLinks.length > 0 ? (
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Selling
            </p>
            {sellingLinks.map((item) => (
              <NavLink key={item.href} {...item} pathname={pathname} />
            ))}
          </div>
        ) : null}
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Activity
          </p>
          {ACCOUNT_ACTIVITY_LINKS.map((item) => (
            <NavLink key={item.href} {...item} pathname={pathname} />
          ))}
        </div>
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Account
          </p>
          {ACCOUNT_SETTINGS_LINKS.map((item) => (
            <NavLink key={item.href} {...item} pathname={pathname} />
          ))}
        </div>
      </nav>
    </aside>
  );
}

export function AccountMobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isDealer = session?.user?.accountType === "dealer";
  const links = isDealer
    ? ACCOUNT_NAV_LINKS.filter((item) => item.href !== "/account/listings")
    : ACCOUNT_NAV_LINKS;

  return (
    <div className="-mx-4 overflow-x-auto no-scrollbar px-4 nav:hidden">
      <nav className="flex min-w-max gap-1 pb-1">
        {links.map((item) => (
          <NavLink key={item.href} {...item} pathname={pathname} compact />
        ))}
      </nav>
    </div>
  );
}
