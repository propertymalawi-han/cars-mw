import Link from "next/link";
import { HeaderAuth } from "@/components/auth/header-auth";
import { BrandLink } from "@/components/brand-mark";
import { SiteMobileNav } from "@/components/site-mobile-nav";
import { Button } from "@/components/ui/button";
import { SITE_NAV_ITEMS } from "@/lib/site-nav";

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
      <header data-site-header className="sticky top-0 z-40 border-b bg-card">
        <div className="mx-auto flex h-16 w-full max-w-site items-center justify-between gap-3 px-4 sm:px-6">
          <BrandLink className="min-w-0 shrink" />
          <nav className="hidden items-center gap-7 nav:flex">
            {SITE_NAV_ITEMS.map((item) => (
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
            <SiteMobileNav />
          </div>
        </div>
      </header>
    </>
  );
}
