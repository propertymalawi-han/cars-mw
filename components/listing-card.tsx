"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { FavouriteButton } from "@/components/account/favourite-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatMWK } from "@/lib/currency";
import { isListingFeatured } from "@/lib/listing-featured";
import { listingDisplayParts } from "@/lib/listing-title";
import { cn } from "@/lib/utils";
import type { Dealer, Listing } from "@/types";

function isNewListing(createdAt: string) {
  const created = new Date(createdAt);
  const now = new Date();
  return now.getTime() - created.getTime() < 1000 * 60 * 60 * 24 * 8;
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function ListingCard({
  listing,
  dealer,
  variant = "grid",
  saved,
  onSavedChange,
  meta,
}: {
  listing: Listing;
  dealer?: Dealer;
  variant?: "grid" | "compact";
  saved?: boolean;
  onSavedChange?: (saved: boolean) => void;
  meta?: ReactNode;
}) {
  const verified = Boolean(dealer?.verified);
  const featured = isListingFeatured(listing.featuredUntil);
  const showNew = !verified && !featured && isNewListing(listing.createdAt);
  const { headline, subtitle } = listingDisplayParts(listing);
  const image = listing.images[0];
  const showSave = typeof saved === "boolean";

  if (variant === "compact") {
    return (
      <Card className="overflow-hidden transition-shadow hover:border-border hover:shadow-md">
        <Link href={`/listings/${listing.id}`} className="flex gap-3 p-3 sm:gap-4 sm:p-4">
          <div className="relative h-[4.75rem] w-[6.75rem] shrink-0 overflow-hidden rounded-md bg-muted sm:h-20 sm:w-32">
            {image ? (
              <Image
                src={image}
                alt={headline}
                fill
                className="object-cover"
                sizes="128px"
              />
            ) : null}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-[1.05rem] font-extrabold leading-none">
              {formatMWK(listing.price)}
            </p>
            <p className="truncate text-sm font-semibold">{headline}</p>
            {subtitle ? (
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {listing.city}
            </p>
            {meta ? <div className="text-xs text-muted-foreground">{meta}</div> : null}
          </div>
        </Link>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-shadow hover:border-border hover:shadow-md",
      )}
    >
      {showSave ? (
        <div className="absolute right-2 top-2 z-10">
          <FavouriteButton
            listingId={listing.id}
            saved={saved}
            onSavedChange={onSavedChange}
          />
        </div>
      ) : null}
      <Link href={`/listings/${listing.id}`} className="flex h-full flex-col">
        <div className="relative flex aspect-[16/9] items-center justify-center border-b bg-muted sm:aspect-[16/10]">
          {image ? (
            <Image
              src={image}
              alt={headline}
              fill
              className="object-cover"
              sizes="(min-width: 860px) 33vw, (min-width: 640px) 50vw, 100vw"
            />
          ) : null}
          {featured ? (
            <Badge variant="copper" className="absolute left-2.5 top-2.5 bg-card">
              Featured
            </Badge>
          ) : verified ? (
            <Badge variant="success" className="absolute left-2.5 top-2.5 bg-card">
              Verified dealer
            </Badge>
          ) : showNew ? (
            <Badge variant="copper" className="absolute left-2.5 top-2.5 bg-card">
              New today
            </Badge>
          ) : null}
          {featured && verified ? (
            <Badge variant="success" className="absolute left-2.5 top-9 bg-card">
              Verified dealer
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 px-4 py-3.5">
          <p className="break-words text-[1.15rem] font-extrabold leading-none">
            {formatMWK(listing.price)}
          </p>
          <p className="text-[0.92rem] font-semibold leading-snug">{headline}</p>
          {subtitle ? (
            <p className="text-[0.82rem] leading-snug text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
          <div className="mt-0.5 flex flex-wrap items-center gap-3.5 text-[0.8rem] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {listing.mileage.toLocaleString("en-MW")} km
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-flex h-3.5 w-3.5 items-center justify-center">
                <span className="h-2.5 w-2.5 rounded-full border border-current" />
              </span>
              {titleCase(listing.transmission)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {listing.city}
            </span>
          </div>
        </div>
      </Link>
    </Card>
  );
}
