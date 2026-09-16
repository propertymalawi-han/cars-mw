import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { FavouriteButton } from "@/components/account/favourite-button";
import { RecordListingView } from "@/components/account/record-listing-view";
import { SendEnquiryForm } from "@/components/account/send-enquiry-form";
import { ContactSeller } from "@/components/contact-seller";
import { ListingCard } from "@/components/listing-card";
import { ListingGallery } from "@/components/listing-gallery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/auth";
import { getEnquiryForListing } from "@/lib/account";
import { formatMWK } from "@/lib/currency";
import {
  dealerForListing,
  getDealerForListing,
  getDealers,
  getListingById,
  getRelatedListings,
  getSellerContact,
} from "@/lib/data";
import { listingDisplayParts } from "@/lib/listing-title";
import { isListingFeatured } from "@/lib/listing-featured";
import { prisma } from "@/lib/prisma";
import { BODY_TYPE_LABELS } from "@/types";

export const dynamic = "force-dynamic";

type ListingPageProps = {
  params: { id: string };
};

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

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

  const session = await auth();
  const [dealer, privateSeller, related, dealers, favourite, existingEnquiry] = await Promise.all([
    getDealerForListing(listing),
    listing.sellerType === "private"
      ? getSellerContact(listing.sellerId)
      : Promise.resolve(undefined),
    getRelatedListings(listing),
    getDealers(),
    session?.user?.id
      ? prisma.favourite.findUnique({
          where: {
            userId_listingId: { userId: session.user.id, listingId: listing.id },
          },
          select: { id: true },
        })
      : Promise.resolve(null),
    session?.user?.id
      ? getEnquiryForListing(session.user.id, listing.id)
      : Promise.resolve(null),
  ]);

  const sellerName = dealer?.name ?? privateSeller?.name ?? "Private seller";
  const sellerPhone = dealer?.phone ?? privateSeller?.phone ?? "";
  const sellerWhatsapp = dealer?.whatsapp ?? privateSeller?.phone ?? "";
  const { headline, subtitle } = listingDisplayParts(listing);
  const displayTitle = subtitle ? `${headline} ${subtitle}` : headline;
  const specs = [
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
      {session?.user?.id ? <RecordListingView listingId={listing.id} /> : null}
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
              {session?.user?.id ? (
                <FavouriteButton listingId={listing.id} saved={Boolean(favourite)} />
              ) : null}
            </div>
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
              />
              {session?.user?.id !== listing.sellerId && listing.status === "active" ? (
                <>
                  <Separator />
                  <SendEnquiryForm
                    listingId={listing.id}
                    returnTo={`/listings/${listing.id}`}
                    existingEnquiryId={existingEnquiry?.id}
                  />
                </>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </div>

      {related.length > 0 ? (
        <section className="space-y-5">
          <div>
            <h2 className="text-[clamp(1.15rem,0.95rem+1vw,1.35rem)] font-bold tracking-tight">
              Related listings
            </h2>
            <p className="mt-1 text-[0.9rem] text-muted-foreground">
              More {listing.make} cars and vehicles in {listing.district}.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 nav:grid-cols-3">
            {related.map((item) => (
              <ListingCard
                key={item.id}
                listing={item}
                dealer={dealerForListing(item, dealers)}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
