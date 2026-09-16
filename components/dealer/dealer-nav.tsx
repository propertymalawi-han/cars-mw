"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  DEALER_NAV_LINKS,
  isDealerNavActive,
} from "@/lib/dealer-nav";
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
  icon: (typeof DEALER_NAV_LINKS)[number]["icon"];
  pathname: string;
  compact?: boolean;
}) {
  const active = isDealerNavActive(pathname, href);
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-md text-sm font-medium transition-colors",
        compact ? "h-10 shrink-0 px-3" : "min-h-11 w-full px-3",
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

export function DealerSidebar({
  dealerName,
  verified,
  logoUrl,
}: {
  dealerName: string;
  verified: boolean;
  logoUrl: string | null;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 nav:block">
      <div className="sticky top-24 overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="border-b bg-primary px-4 py-4 text-primary-foreground">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-primary-foreground/70">
            Dealer workspace
          </p>
          <div className="mt-3 flex items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt=""
                className="size-10 rounded-md object-cover ring-1 ring-white/15"
              />
            ) : (
              <span className="flex size-10 items-center justify-center rounded-md bg-copper text-sm font-bold text-copper-foreground">
                {dealerName.slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold leading-tight">{dealerName}</p>
              {verified ? (
                <Badge variant="success" className="mt-1 bg-card px-1.5 py-0 text-[0.65rem]">
                  Verified
                </Badge>
              ) : (
                <Badge variant="secondary" className="mt-1 px-1.5 py-0 text-[0.65rem]">
                  Unverified
                </Badge>
              )}
            </div>
          </div>
        </div>
        <nav className="space-y-1 p-2">
          {DEALER_NAV_LINKS.map((item) => (
            <NavLink key={item.href} {...item} pathname={pathname} />
          ))}
        </nav>
      </div>
    </aside>
  );
}

export function DealerMobileNav({
  dealerName,
  verified,
}: {
  dealerName: string;
  verified: boolean;
}) {
  const pathname = usePathname();

  return (
    <div className="nav:hidden">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Dealer workspace
          </p>
          <p className="font-semibold">{dealerName}</p>
        </div>
        {verified ? (
          <Badge variant="success">Verified</Badge>
        ) : (
          <Badge variant="secondary">Unverified</Badge>
        )}
      </div>
      <div className="-mx-4 overflow-x-auto no-scrollbar px-4">
        <nav className="flex min-w-max gap-1 pb-1">
          {DEALER_NAV_LINKS.map((item) => (
            <NavLink key={item.href} {...item} pathname={pathname} compact />
          ))}
        </nav>
      </div>
    </div>
  );
}
