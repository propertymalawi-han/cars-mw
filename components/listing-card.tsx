import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatMWK } from "@/lib/currency";
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
}: {
  listing: Listing;
  dealer?: Dealer;
}) {
  const verified = Boolean(dealer?.verified);
  const showNew = !verified && isNewListing(listing.createdAt);

  return (
    <Card
      className={cn(
        "overflow-hidden transition-shadow hover:border-border hover:shadow-md",
      )}
    >
      <Link href={`/listings/${listing.id}`} className="flex h-full flex-col">
        <div className="relative flex aspect-[16/9] items-center justify-center border-b bg-muted sm:aspect-[16/10]">
          <Image
            src={listing.images[0] ?? ""}
            alt={listing.title}
            fill
            className="object-cover"
            sizes="(min-width: 860px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
          {verified ? (
            <Badge variant="success" className="absolute left-2.5 top-2.5 bg-card">
              Verified dealer
            </Badge>
          ) : null}
          {showNew ? (
            <Badge variant="copper" className="absolute left-2.5 top-2.5 bg-card">
              New today
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 px-4 py-3.5">
          <p className="break-words text-[1.15rem] font-extrabold leading-none">
            {formatMWK(listing.price)}
          </p>
          <p className="text-[0.92rem] font-semibold leading-snug">{listing.title}</p>
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
