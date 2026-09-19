"use client";

import { useState } from "react";
import { BodyTypeTabs } from "@/components/marketing/body-type-tabs";
import { ListingsGrid } from "@/components/marketing/listings-grid";
import type { HomeFeaturedSections, HomeFeaturedTabId } from "@/lib/home-featured";

export function FeaturedListings({ sections }: { sections: HomeFeaturedSections }) {
  const [body, setBody] = useState<HomeFeaturedTabId>("all");
  const selected = sections[body] ?? sections.all;

  return (
    <>
      <BodyTypeTabs active={body} onChange={setBody} />
      <ListingsGrid listings={selected.listings} dealers={selected.dealers} />
    </>
  );
}
