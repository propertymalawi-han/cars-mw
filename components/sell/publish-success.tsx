"use client";

import { useState } from "react";
import Link from "next/link";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { buildListingTitle } from "@/lib/listing-title";
import { whatsappShareHref } from "@/lib/phone";
import type { ListingFormValues } from "@/lib/validations/listing";
import type { Listing } from "@/types";

export function PublishSuccess({
  listingId,
  values,
  listingsHref,
  updated,
  onListAnother,
}: {
  listingId: string;
  values: ListingFormValues;
  listingsHref: string;
  updated?: boolean;
  onListAnother: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const title = buildListingTitle(values);
  const path = `/listings/${listingId}`;
  const url = typeof window === "undefined" ? path : `${window.location.origin}${path}`;
  const message = `${title} is listed on CarsMW. ${url}`;
  const listing: Listing = {
    id: listingId,
    vehicleNumber: 0,
    title,
    make: values.make,
    model: values.model,
    year: values.year,
    price: values.price,
    mileage: values.mileage,
    transmission: values.transmission,
    fuelType: values.fuelType,
    bodyType: values.bodyType,
    district: values.district,
    city: values.city,
    images: values.images,
    description: values.description,
    sellerId: "",
    sellerType: "private",
    status: "active",
    createdAt: new Date().toISOString(),
  };

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">
          {updated ? "Listing updated" : "Your listing is live"}
        </h2>
        <p className="text-sm text-muted-foreground">
          Share it with buyers, or go back to your listings.
        </p>
      </div>
      <ListingCard listing={listing} />
      <div className="grid gap-3">
        <Button asChild variant="copper" className="h-11">
          <a href={whatsappShareHref(message)} target="_blank" rel="noreferrer">
            Share on WhatsApp
          </a>
        </Button>
        <Button type="button" variant="outline" className="h-11" onClick={() => void copyLink()}>
          {copied ? "Link copied" : "Copy link"}
        </Button>
        <Button type="button" variant="outline" className="h-11" onClick={onListAnother}>
          List another vehicle
        </Button>
        <Button asChild variant="ghost" className="h-11">
          <Link href={listingsHref}>View my listings</Link>
        </Button>
      </div>
    </div>
  );
}
