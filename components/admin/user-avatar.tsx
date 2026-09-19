"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

function initials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "U";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function AdminUserAvatar({
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
      <span className={cn("relative inline-block overflow-hidden rounded-full bg-muted", className)}>
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
