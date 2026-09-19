"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function SiteTopBar({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <>{children}</>;
}

export function SiteHeaderBar({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const overlay = pathname === "/";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!overlay) {
      setScrolled(false);
      return;
    }

    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overlay]);

  const overHero = overlay && !scrolled;

  return (
    <header
      data-site-header
      data-over-hero={overHero ? "" : undefined}
      className={cn(
        "group/header sticky top-0 z-40",
        overlay
          ? scrolled
            ? "border-b bg-card/95 backdrop-blur-sm"
            : "border-b border-transparent bg-transparent"
          : "border-b bg-card",
      )}
    >
      {children}
    </header>
  );
}
