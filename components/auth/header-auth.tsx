"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LogOut, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SheetClose } from "@/components/ui/sheet";
import {
  ACCOUNT_ACTIVITY_LINKS,
  ACCOUNT_SELLING_LINKS,
  ACCOUNT_SETTINGS_LINKS,
  isAccountNavActive,
} from "@/lib/account-nav";
import { cn } from "@/lib/utils";

function initials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "U";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function UserAvatar({
  src,
  name,
  email,
  className,
}: {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <span className={cn("relative inline-block overflow-hidden rounded-full", className)}>
        <Image
          src={src}
          alt=""
          fill
          className="object-cover"
          sizes="40px"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "flex items-center justify-center rounded-full bg-primary text-[0.65rem] font-semibold tracking-wide text-primary-foreground",
        className,
      )}
    >
      {initials(name, email)}
    </span>
  );
}

function isActivePath(pathname: string, href: string) {
  return isAccountNavActive(pathname, href);
}

export function HeaderAuth({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (status === "loading") {
    if (compact) return null;
    return (
      <div
        aria-hidden
        className="hidden size-9 shrink-0 animate-pulse rounded-full bg-muted nav:block"
      />
    );
  }

  if (status !== "authenticated" || !session?.user) {
    if (compact) {
      return (
        <Button variant="ghost" className="h-11 w-full justify-start px-3" asChild>
          <Link href="/sign-in">Sign in</Link>
        </Button>
      );
    }

    return (
      <Button variant="ghost" className="hidden nav:inline-flex" asChild>
        <Link href="/sign-in">Sign in</Link>
      </Button>
    );
  }

  const user = session.user;
  const isDealer = user.accountType === "dealer";
  const sellingLinks = isDealer ? [] : ACCOUNT_SELLING_LINKS;
  const email = user.email ?? user.name ?? "Account";

  function handleSignOut() {
    void signOut({ redirectTo: "/" }).then(() => router.refresh());
  }

  if (compact) {
    const sheetItemClass = (href?: string) =>
      cn(
        "flex min-h-11 items-center gap-2.5 rounded-md px-3 text-sm font-medium text-foreground hover:bg-copper/10 hover:text-copper",
        href && isActivePath(pathname, href) && "bg-copper/10 text-copper",
      );

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3 px-3 py-2">
          <UserAvatar
            src={user.avatarUrl}
            name={user.name}
            email={user.email}
            className="size-10 shrink-0"
          />
          <p className="min-w-0 truncate text-sm font-medium text-foreground">
            {email}
          </p>
        </div>
        {isDealer ? (
          <>
            <SheetClose asChild>
              <Link href="/dealer/dashboard" className={sheetItemClass("/dealer/dashboard")}>
                <Store className="size-4 shrink-0" />
                <span className="flex-1">Dealer dashboard</span>
                <Badge variant="copper" className="px-1.5 py-0 text-[0.65rem] leading-4">
                  Dealer
                </Badge>
              </Link>
            </SheetClose>
            <Separator className="my-1" />
          </>
        ) : null}
        {sellingLinks.map((item) => (
          <SheetClose key={item.href} asChild>
            <Link href={item.href} className={sheetItemClass(item.href)}>
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          </SheetClose>
        ))}
        {sellingLinks.length > 0 ? <Separator className="my-1" /> : null}
        {ACCOUNT_ACTIVITY_LINKS.map((item) => (
          <SheetClose key={item.href} asChild>
            <Link href={item.href} className={sheetItemClass(item.href)}>
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          </SheetClose>
        ))}
        <Separator className="my-1" />
        {ACCOUNT_SETTINGS_LINKS.map((item) => (
          <SheetClose key={item.href} asChild>
            <Link href={item.href} className={sheetItemClass(item.href)}>
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          </SheetClose>
        ))}
        <Separator className="my-1" />
        <SheetClose asChild>
          <button type="button" className={sheetItemClass()} onClick={handleSignOut}>
            <LogOut className="size-4 shrink-0" />
            Sign out
          </button>
        </SheetClose>
      </div>
    );
  }

  const menuItemClass = (href?: string) =>
    cn(
      "cursor-pointer text-foreground hover:bg-copper/10 hover:text-copper focus:bg-copper/10 focus:text-copper",
      href && isActivePath(pathname, href) && "bg-copper/10 text-copper",
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Account menu for ${email}`}
          className="hidden size-9 rounded-full p-0 text-foreground hover:bg-transparent hover:ring-2 hover:ring-copper hover:ring-offset-2 hover:ring-offset-card data-[state=open]:bg-transparent data-[state=open]:ring-2 data-[state=open]:ring-copper data-[state=open]:ring-offset-2 data-[state=open]:ring-offset-card nav:inline-flex"
        >
          <UserAvatar
            src={user.avatarUrl}
            name={user.name}
            email={user.email}
            className="size-9"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-72">
        <DropdownMenuLabel className="p-2 font-normal">
          <div className="flex items-center gap-3">
            <UserAvatar
              src={user.avatarUrl}
              name={user.name}
              email={user.email}
              className="size-10 shrink-0"
            />
            <p className="min-w-0 truncate text-sm font-medium text-foreground">
              {email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        {isDealer ? (
          <>
            <DropdownMenuItem asChild className={menuItemClass("/dealer/dashboard")}>
              <Link href="/dealer/dashboard">
                <Store />
                <span className="flex-1">Dealer dashboard</span>
                <Badge variant="copper" className="px-1.5 py-0 text-[0.65rem] leading-4">
                  Dealer
                </Badge>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
          </>
        ) : null}
        {sellingLinks.map((item) => (
          <DropdownMenuItem key={item.href} asChild className={menuItemClass(item.href)}>
            <Link href={item.href}>
              <item.icon />
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
        {sellingLinks.length > 0 ? <DropdownMenuSeparator className="bg-border" /> : null}
        {ACCOUNT_ACTIVITY_LINKS.map((item) => (
          <DropdownMenuItem key={item.href} asChild className={menuItemClass(item.href)}>
            <Link href={item.href}>
              <item.icon />
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="bg-border" />
        {ACCOUNT_SETTINGS_LINKS.map((item) => (
          <DropdownMenuItem key={item.href} asChild className={menuItemClass(item.href)}>
            <Link href={item.href}>
              <item.icon />
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem
          className={menuItemClass()}
          onSelect={(event) => {
            event.preventDefault();
            handleSignOut();
          }}
        >
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
