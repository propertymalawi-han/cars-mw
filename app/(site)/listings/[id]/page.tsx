import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { RecordListingView } from "@/components/account/record-listing-view";
import { ContactSeller } from "@/components/contact-seller";
import { ListingEnquiry, ListingFavourite } from "@/components/listing-buyer-actions";
import { ListingGallery } from "@/components/listing-gallery";
import { ListingRelated } from "@/components/listing-related";
import { ListingCardSkeleton } from "@/components/listing-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { VehicleId } from "@/components/vehicle-id";
import { formatMWK } from "@/lib/currency";
import {
  getDealerForListing,
  getListingById,
  getSellerContact,
} from "@/lib/data";
import { listingDisplayParts } from "@/lib/listing-title";
import { isListingFeatured } from "@/lib/listing-featured";
import { formatVehicleId } from "@/lib/vehicle-id";
import { BODY_TYPE_LABELS } from "@/types";

type ListingPageProps = {
  params: { id: string };
};

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export const revalidate = 120;

export async function generateMetadata({
  params,
}: ListingPageProps): Promise<Metadata> {
  const listing = await getListingById(params.id);
  if (!listing) {
    return { title: "Listing not found" };
  }

  const { headline, subtitle } = listingDisplayParts(listing);
  const title = subtitle ? `${headline} ${subtitle}` : headline;

  return {
    title,
    description: `${title} in ${listing.city} for ${formatMWK(listing.price)}.`,
  };
}

export default async function ListingDetailPage({ params }: ListingPageProps) {
  const listing = await getListingById(params.id);

  if (!listing) {
    notFound();
  }

  const [dealer, privateSeller] = await Promise.all([
    getDealerForListing(listing),
    listing.sellerType === "private"
      ? getSellerContact(listing.sellerId)
      : Promise.resolve(undefined),
  ]);

  const sellerName = dealer?.name ?? privateSeller?.name ?? "Private seller";
  const sellerPhone = dealer?.phone ?? privateSeller?.phone ?? "";
  const sellerWhatsapp = dealer?.whatsapp ?? privateSeller?.phone ?? "";
  const { headline, subtitle } = listingDisplayParts(listing);
  const displayTitle = subtitle ? `${headline} ${subtitle}` : headline;
  const specs = [
    { label: "Vehicle ID", value: formatVehicleId(listing.vehicleNumber) },
    { label: "Make", value: listing.make },
    { label: "Model", value: listing.model },
    { label: "Year", value: String(listing.year) },
    { label: "Mileage", value: `${listing.mileage.toLocaleString("en-MW")} km` },
    { label: "Transmission", value: titleCase(listing.transmission) },
    { label: "Fuel", value: titleCase(listing.fuelType) },
    { label: "Body type", value: BODY_TYPE_LABELS[listing.bodyType] },
    { label: "City", value: listing.city },
    { label: "District", value: listing.district },
    {
      label: "Seller",
      value: listing.sellerType === "dealer" ? "Dealer" : "Private seller",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-site space-y-10 px-4 py-8 sm:space-y-12 sm:px-6 sm:py-10">
      <RecordListingView listingId={listing.id} />
      <div className="grid min-w-0 items-start gap-8 lg:grid-cols-[minmax(0,1.5fr)_320px]">
        <div className="space-y-6">
          <ListingGallery images={listing.images} title={displayTitle} />

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{BODY_TYPE_LABELS[listing.bodyType]}</Badge>
              <Badge variant="outline">{listing.year}</Badge>
              {isListingFeatured(listing.featuredUntil) ? (
                <Badge variant="copper">Featured</Badge>
              ) : null}
              {listing.status === "sold" ? (
                <Badge variant="copper">Sold</Badge>
              ) : null}
              {listing.status === "expired" ? (
                <Badge variant="outline">Expired</Badge>
              ) : null}
            </div>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-[clamp(1.5rem,1.1rem+2vw,1.875rem)] font-bold tracking-tight">
                {headline}
              </h1>
              <ListingFavourite listingId={listing.id} />
            </div>
            <p className="text-sm text-muted-foreground">
              Vehicle ID <VehicleId vehicleNumber={listing.vehicleNumber} className="font-medium text-foreground" />
            </p>
            {subtitle ? (
              <p className="text-base text-muted-foreground">{subtitle}</p>
            ) : null}
            <p className="text-[clamp(1.35rem,1rem+1.6vw,1.65rem)] font-extrabold leading-none">
              {formatMWK(listing.price)}
            </p>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {listing.city}, {listing.district}
            </p>
          </div>

          <p className="leading-relaxed text-muted-foreground">
            {listing.description}
          </p>

          <section className="space-y-3">
            <h2 className="text-lg font-bold">Specifications</h2>
            <div className="overflow-hidden rounded-lg border bg-card">
              <table className="w-full text-sm">
                <tbody>
                  {specs.map((spec, index) => (
                    <tr
                      key={spec.label}
                      className={index < specs.length - 1 ? "border-b" : undefined}
                    >
                      <th className="w-[38%] bg-muted/60 px-3 py-2.5 text-left font-medium text-muted-foreground sm:w-[40%] sm:px-4">
                        {spec.label}
                      </th>
                      <td className="px-3 py-2.5 font-medium sm:px-4">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24">
          <Card>
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>Seller</CardTitle>
                {dealer?.verified ? (
                  <Badge variant="success">Verified</Badge>
                ) : null}
              </div>
              <div className="space-y-1">
                <p className="font-semibold">{sellerName}</p>
                <p className="text-sm text-muted-foreground">
                  {dealer
                    ? dealer.districts.join(", ")
                    : `${listing.city}, ${listing.district}`}
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {dealer ? (
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/dealers/${dealer.slug}`}>View dealer profile</Link>
                </Button>
              ) : null}
              {dealer ? <Separator /> : null}
              <ContactSeller
                phone={sellerPhone}
                whatsapp={sellerWhatsapp}
                listingTitle={displayTitle}
                vehicleId={formatVehicleId(listing.vehicleNumber)}
              />
              <ListingEnquiry
                listingId={listing.id}
                sellerId={listing.sellerId}
                listingActive={listing.status === "active"}
                returnTo={`/listings/${listing.id}`}
              />
            </CardContent>
          </Card>
        </aside>
      </div>

      <Suspense
        fallback={
          <section className="space-y-5">
            <div className="space-y-1">
              <div className="h-6 w-48 rounded-md bg-primary/10" />
              <div className="h-4 w-72 rounded-md bg-primary/10" />
            </div>
            <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 nav:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <ListingCardSkeleton key={index} />
              ))}
            </div>
          </section>
        }
      >
        <ListingRelated listing={listing} />
      </Suspense>
    </div>
  );
}
