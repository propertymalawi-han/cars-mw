import { ListingGallery } from "@/components/listing-gallery";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VehicleId } from "@/components/vehicle-id";
import { formatMWK } from "@/lib/currency";
import { LISTING_STATUS_LABEL } from "@/lib/listing-featured";
import { listingDisplayParts } from "@/lib/listing-title";
import type { Listing } from "@/types";
import { BODY_TYPE_LABELS } from "@/types";

const STATUS_VARIANT: Record<Listing["status"], "success" | "copper" | "secondary" | "outline"> = {
  active: "success",
  sold: "copper",
  draft: "secondary",
  expired: "outline",
};

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function EditListingSummary({ listing }: { listing: Listing }) {
  const { headline, subtitle } = listingDisplayParts(listing);
  const details = [
    { label: "Make", value: listing.make },
    { label: "Model", value: listing.model },
    { label: "Year", value: String(listing.year) },
    { label: "Mileage", value: `${listing.mileage.toLocaleString("en-MW")} km` },
    { label: "Body type", value: BODY_TYPE_LABELS[listing.bodyType] },
    { label: "Transmission", value: titleCase(listing.transmission) },
    { label: "Fuel", value: titleCase(listing.fuelType) },
    { label: "Location", value: `${listing.city}, ${listing.district}` },
    { label: "Price", value: formatMWK(listing.price) },
  ];

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1">
            <CardDescription className="font-medium uppercase tracking-wide">
              Vehicle ID
            </CardDescription>
            <p className="text-lg font-semibold leading-none">
              <VehicleId vehicleNumber={listing.vehicleNumber} />
            </p>
          </div>
          <Badge variant={STATUS_VARIANT[listing.status]}>
            {LISTING_STATUS_LABEL[listing.status]}
          </Badge>
        </div>
        <div className="space-y-1">
          <CardTitle className="text-xl">{headline}</CardTitle>
          {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <ListingGallery images={listing.images} title={headline} compact />
        <dl className="overflow-hidden rounded-lg border">
          {details.map((detail) => (
            <div
              key={detail.label}
              className="grid grid-cols-1 gap-1 border-b px-3 py-2.5 text-sm last:border-b-0 xs:grid-cols-[7.5rem_1fr] xs:gap-3 sm:grid-cols-[8.5rem_1fr] sm:px-4"
            >
              <dt className="font-medium text-muted-foreground">{detail.label}</dt>
              <dd className="min-w-0 break-words font-medium">{detail.value}</dd>
            </div>
          ))}
          {listing.description ? (
            <div className="grid grid-cols-1 gap-1 px-3 py-2.5 text-sm sm:grid-cols-[8.5rem_1fr] sm:gap-3 sm:px-4">
              <dt className="font-medium text-muted-foreground">Description</dt>
              <dd className="min-w-0 whitespace-pre-wrap break-words font-medium">
                {listing.description}
              </dd>
            </div>
          ) : null}
        </dl>
      </CardContent>
    </Card>
  );
}
