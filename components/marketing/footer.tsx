import Link from "next/link";
import { BrandLink } from "@/components/brand-mark";

const COLUMNS = [
  {
    title: "Buy",
    links: [
      { href: "/listings", label: "All listings" },
      { href: "/listings", label: "Cars by brand" },
      { href: "/listings", label: "Cars by district" },
    ],
  },
  {
    title: "Sell",
    links: [
      { href: "/sell", label: "List your car" },
      { href: "/tools/valuation", label: "Free valuation" },
      { href: "/tools/import-calculator", label: "Import calculator" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/#about", label: "About CarsMW" },
      { href: "/#about", label: "Contact us" },
      { href: "/#about", label: "Help centre" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="mt-5 bg-primary pb-6 pt-12 text-primary-foreground/60">
      <div className="mx-auto w-full max-w-site px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-8 border-b border-primary-foreground/10 pb-7 xs:grid-cols-2 md:grid-cols-4">
          <div className="xs:col-span-2 md:col-span-1">
            <BrandLink light />
            <p className="mt-3 max-w-[32ch] text-[0.85rem]">
              Malawi&apos;s marketplace for buying and selling cars, bakkies and
              SUVs — from Lilongwe to Mzuzu.
            </p>
          </div>
          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h5 className="mb-3 text-[0.8rem] font-semibold text-primary-foreground">
                {column.title}
              </h5>
              <ul className="grid gap-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-11 items-center text-[0.85rem] hover:text-primary-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-[18px] flex flex-wrap justify-between gap-2.5 text-[0.78rem]">
          <span>© 2026 CarsMW. All rights reserved.</span>
          <span>Made for Malawi</span>
        </div>
      </div>
    </footer>
  );
}
