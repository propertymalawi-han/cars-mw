"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export function RecordListingView({ listingId }: { listingId: string }) {
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;
    void fetch("/api/account/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
  }, [listingId, status]);

  return null;
}
