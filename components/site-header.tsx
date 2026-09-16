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

const navItems = [
  { href: "/listings", label: "Buy a car" },
  { href: "/sell", label: "Sell your car" },
  { href: "/tools/valuation", label: "Valuation" },
  { href: "/#about", label: "About" },
];

const drawerExtras = [
  { href: "/#about", label: "Help centre" },
  { href: "/listings", label: "Dealers" },
];

export function SiteHeader() {
  return (
    <>
      <div className="bg-primary text-[0.78rem] text-primary-foreground/70">
        <div className="mx-auto flex min-h-11 w-full max-w-site items-center justify-between px-4 sm:px-6">
          <a
            href="tel:+265111000000"
            className="inline-flex min-h-11 items-center hover:text-primary-foreground"
          >
            +265 1 11 000 000
          </a>
          <div className="hidden items-center gap-5 nav:flex">
            <Link href="/#about" className="hover:text-primary-foreground">
              Help centre
            </Link>
            <Link href="/listings" className="hover:text-primary-foreground">
              Dealers
            </Link>
            <Link href="/sell" className="hover:text-primary-foreground">
              List your car
            </Link>
          </div>
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b bg-card">
        <div className="mx-auto flex h-16 w-full max-w-site items-center justify-between gap-3 px-4 sm:px-6">
          <BrandLink className="min-w-0 shrink" />
          <nav className="hidden items-center gap-7 nav:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2.5">
            <HeaderAuth />
            <Button className="hidden nav:inline-flex" asChild>
              <Link href="/sell">Sell your car</Link>
            </Button>
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
                  {navItems.map((item) => (
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
                  {drawerExtras.map((item) => (
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
          </div>
        </div>
      </header>
    </>
  );
}
