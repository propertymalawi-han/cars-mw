"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ListingCard } from "@/components/listing-card";
import { EmptyState } from "@/components/account/empty-state";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format-date";
import type { Dealer, Listing } from "@/types";

export function ViewHistoryList({
  items,
}: {
  items: { listing: Listing; dealer?: Dealer; viewedAt: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function clearHistory() {
    setBusy(true);
    try {
      const response = await fetch("/api/account/views", { method: "DELETE" });
      if (!response.ok) return;
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No recent activity"
        description="Listings you view will appear here, newest first."
        action={{ href: "/listings", label: "Browse cars" }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => void clearHistory()}
        >
          {busy ? "Clearing…" : "Clear history"}
        </Button>
      </div>
      <ol className="space-y-3">
        {items.map((item) => (
          <li key={`${item.listing.id}-${item.viewedAt}`}>
            <ListingCard
              listing={item.listing}
              dealer={item.dealer}
              variant="compact"
              meta={<span>Viewed {formatDateTime(item.viewedAt)}</span>}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}
