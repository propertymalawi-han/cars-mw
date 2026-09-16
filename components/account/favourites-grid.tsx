"use client";

import { useState } from "react";
import { ListingCard } from "@/components/listing-card";
import { EmptyState } from "@/components/account/empty-state";
import type { Dealer, Listing } from "@/types";

export function FavouritesGrid({
  items,
}: {
  items: { listing: Listing; dealer?: Dealer }[];
}) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const visible = items.filter((item) => !hidden.has(item.listing.id));

  if (visible.length === 0) {
    return (
      <EmptyState
        title="No saved listings yet"
        description="Tap the heart on a car you like and it will show up here."
        action={{ href: "/listings", label: "Browse cars" }}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
      {visible.map(({ listing, dealer }) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          dealer={dealer}
          saved
          onSavedChange={(saved) => {
            if (!saved) {
              setHidden((current) => new Set(current).add(listing.id));
            }
          }}
        />
      ))}
    </div>
  );
}
