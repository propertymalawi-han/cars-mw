import Link from "next/link";

import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  light = false,
}: {
  className?: string;
  light?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[1.15rem] font-extrabold tracking-tight transition-colors",
        light
          ? "text-primary-foreground"
          : "text-foreground group-data-[over-hero]/header:text-white",
        className,
      )}
    >
      Cars
      <span className="relative -top-px rounded-[4px] bg-copper px-1.5 py-0.5 text-[0.62rem] font-bold tracking-wide text-copper-foreground">
        MW
      </span>
    </span>
  );
}

export function BrandLink({
  className,
  light = false,
}: {
  className?: string;
  light?: boolean;
}) {
  return (
    <Link href="/" className={className}>
      <BrandMark light={light} />
    </Link>
  );
}
