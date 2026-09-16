import type { Metadata } from "next";
import { auth } from "@/auth";
import { SellForm } from "@/components/sell/sell-form";
import { prisma } from "@/lib/prisma";
import { listingFormDefaults, type ListingFormInput } from "@/lib/validations/listing";

export const metadata: Metadata = {
  title: "Sell your car",
  description: "Create a listing and sell your car in Malawi for MWK.",
};

export const dynamic = "force-dynamic";

type SellPageProps = {
  searchParams: { listingId?: string; from?: string };
};

export default async function SellPage({ searchParams }: SellPageProps) {
  const session = await auth();
  const fromDealer = searchParams.from === "dealer";
  let defaultValues: Partial<ListingFormInput> | undefined;
  let listingId: string | undefined;
  let editingDraft = false;

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { dealer: true },
    });

    if (user) {
      defaultValues = {
        sellerName: user.dealer?.name ?? user.name,
        sellerEmail: user.email,
        phone: user.dealer?.phone ?? user.phone ?? "",
      };

      if (searchParams.listingId) {
        const listing = await prisma.listing.findFirst({
          where: { id: searchParams.listingId, sellerId: user.id },
        });
        if (listing) {
          listingId = listing.id;
          editingDraft = listing.status === "draft";
          defaultValues = {
            ...defaultValues,
            make: listing.make,
            model: listing.model,
            year: listing.year,
            mileage: listing.mileage,
            city: listing.city as ListingFormInput["city"],
            district: listing.district as ListingFormInput["district"],
            bodyType: listing.bodyType,
            transmission: listing.transmission,
            fuelType: listing.fuelType,
            description: listing.description,
            images: listing.images,
            price: listing.price,
          };
        }
      }
    }
  }

  const dealerFlow = fromDealer || session?.user?.accountType === "dealer";
  const fromAccount = searchParams.from === "account";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="space-y-2">
        <h1 className="text-[clamp(1.5rem,1.1rem+2vw,1.875rem)] font-semibold tracking-tight">
          {listingId ? (editingDraft ? "Finish this listing" : "Edit listing") : "Sell your car"}
        </h1>
        <p className="text-muted-foreground">
          {listingId
            ? "Update the vehicle details, photos, price, or contact information."
            : "List in a few steps: vehicle details, photos, price, and your contact information. Prices are in Malawian Kwacha."}
        </p>
      </div>
      <SellForm
        defaultValues={{ ...listingFormDefaults, ...defaultValues }}
        listingId={listingId}
        redirectTo={
          dealerFlow
            ? "/dealer/dashboard/listings"
            : fromAccount || session?.user
              ? "/account/listings"
              : undefined
        }
      />
    </div>
  );
}
