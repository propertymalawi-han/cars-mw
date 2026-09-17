"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { HeaderAuth } from "@/components/auth/header-auth";
import { BrandLink } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SITE_DRAWER_EXTRAS, SITE_NAV_ITEMS } from "@/lib/site-nav";

export function SiteMobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-foreground nav:hidden"
          aria-label="Open menu"
        >
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[min(100%,20rem)] gap-0 overflow-y-auto p-0"
      >
        <SheetHeader className="border-b px-6 py-4 pr-14">
          <SheetTitle className="text-left">
            <BrandLink />
          </SheetTitle>
          <SheetDescription className="sr-only">
            Site navigation
          </SheetDescription>
        </SheetHeader>
        <nav className="flex flex-1 flex-col px-4 py-4">
          {SITE_NAV_ITEMS.map((item) => (
            <SheetClose key={item.href} asChild>
              <Link
                href={item.href}
                className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            </SheetClose>
          ))}
          <Separator className="my-3" />
          {SITE_DRAWER_EXTRAS.map((item) => (
            <SheetClose key={item.label} asChild>
              <Link
                href={item.href}
                className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            </SheetClose>
          ))}
          <Separator className="my-3" />
          <HeaderAuth compact />
          <SheetClose asChild>
            <Button className="mt-2 h-11 w-full" asChild>
              <Link href="/sell">Sell your car</Link>
            </Button>
          </SheetClose>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
