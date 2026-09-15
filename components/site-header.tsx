"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { BrandLink } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/listings", label: "Buy a car" },
  { href: "/sell", label: "Sell your car" },
  { href: "/tools/valuation", label: "Valuation" },
  { href: "/#about", label: "About" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="bg-primary text-[0.78rem] text-primary-foreground/70">
        <div className="mx-auto flex h-[34px] w-full max-w-site items-center justify-between px-6">
          <div className="flex gap-5">
            <a href="tel:+265111000000" className="hover:text-primary-foreground">
              +265 1 11 000 000
            </a>
            <Link href="/#about" className="hover:text-primary-foreground">
              Help centre
            </Link>
          </div>
          <div className="hidden gap-5 sm:flex">
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
        <div className="relative mx-auto flex h-16 w-full max-w-site items-center justify-between px-6">
          <BrandLink />
          <nav className="hidden items-center gap-7 md:flex">
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
            <Button variant="ghost" className="hidden sm:inline-flex" asChild>
              <Link href="/sell">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/sell">Sell your car</Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-foreground md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
        <nav
          className={cn(
            "flex flex-col gap-3.5 border-b bg-card px-6 py-4 md:hidden",
            open ? "flex" : "hidden",
          )}
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}
