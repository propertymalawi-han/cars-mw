"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function ListingLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();

  function prefetch() {
    router.prefetch(href);
  }

  return (
    <Link
      href={href}
      prefetch={false}
      className={className}
      onPointerEnter={prefetch}
      onFocus={prefetch}
    >
      {children}
    </Link>
  );
}
