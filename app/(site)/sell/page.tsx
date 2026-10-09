import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { EditListingSummary } from "@/components/sell/edit-listing-summary";
import { SellForm } from "@/components/sell/sell-form";
import { getListingById, getVehicleMakes } from "@/lib/data";
import { isGoogleAuthEnabled } from "@/lib/auth-env";
import { variantFromTitle } from "@/lib/make-picker";
import { formatPhoneInput } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { mapPrismaListing } from "@/lib/prisma-mappers";
import { getSellCatalog } from "@/lib/sell-catalog";
import { getSupabase } from "@/lib/supabase/server";
import { getUserSuspension } from "@/lib/user-status";
import { listingFormDefaults, type ListingFormInput } from "@/lib/validations/listing";
import type { Listing } from "@/types";
import { isStaffRole } from "@/types";

export const metadata: Metadata = {
  title: "Sell your car",
  description: "Create a listing and sell your car in Malawi for MWK.",
};

export const dynamic = "force-dynamic";

type SellPageProps = {
  searchParams: { listingId?: string; from?: string; auth?: string };
};

export default async function SellPage({ searchParams }: SellPageProps) {
  const session = await auth();
  const fromDealer = searchParams.from === "dealer";
  const fromAdmin = searchParams.from === "admin";
  const staff = isStaffRole(session?.user?.role);
  const listingsHref = fromAdmin
    ? "/admin/listings"
    : fromDealer || session?.user?.accountType === "dealer"
      ? "/dealer/dashboard/listings"
      : "/account/listings";

  if (!session?.user) {
    const [makes, catalog] = await Promise.all([getVehicleMakes(), getSellCatalog()]);
    const promptAuth = searchParams.auth === "sign-in" || searchParams.auth === "sign-up";

    return (
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <div className="space-y-2">
          <h1 className="text-[clamp(1.5rem,1.1rem+2vw,1.875rem)] font-semibold tracking-tight">
            Sell your car
          </h1>
          <p className="text-muted-foreground">
            Start with the vehicle and your price. Sign in when you add photos — your
            progress stays on this phone.
          </p>
        </div>
        <SellForm
          signedIn={false}
          promptAuth={promptAuth}
          authTab={searchParams.auth === "sign-up" ? "sign-up" : "sign-in"}
          googleEnabled={isGoogleAuthEnabled()}
          defaultValues={listingFormDefaults}
          makes={makes}
          catalog={catalog}
        />
      </div>
    );
  }

  let defaultValues: Partial<ListingFormInput> = {
    sellerName: session.user.name ?? "",
    sellerEmail: session.user.email ?? "",
    phone: "",
  };
  let listingId: string | undefined;
  let editingDraft = false;
  let editingListing: Listing | undefined;
  let profilePhone = "";

  if (process.env.DATABASE_URL) {
    try {
      const profile = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { phone: true },
      });
      profilePhone = profile?.phone ?? "";
    } catch (error) {
      console.error("Failed to load profile phone", error);
    }
  }

  const { data: dealer } = await getSupabase()
    .from("dealers")
    .select("name, phone")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (dealer) {
    defaultValues = {
      ...defaultValues,
      sellerName: dealer.name || defaultValues.sellerName,
    };
  }

  defaultValues.phone = formatPhoneInput(dealer?.phone || profilePhone || "");

  if (searchParams.listingId) {
    const listing = process.env.DATABASE_URL
      ? await prisma.listing
          .findFirst({
            where: {
              id: searchParams.listingId,
              deletedAt: null,
              ...(staff ? {} : { sellerId: session.user.id }),
            },
          })
          .then((row) => (row ? mapPrismaListing(row) : undefined))
      : await getListingById(searchParams.listingId).then((loaded) =>
          loaded && (staff || loaded.sellerId === session.user.id) ? loaded : undefined,
        );

    if (listing) {
      listingId = listing.id;
      editingDraft = listing.status === "draft";
      editingListing = listing;
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
        variant: variantFromTitle(listing.title, listing.make, listing.model) ?? "",
      };
    }
  }

  if (!listingId && !staff) {
    const status = await getUserSuspension(session.user.id);
    if (status?.suspended) {
      return (
        <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-8 sm:px-6 sm:py-10">
          <h1 className="text-[clamp(1.5rem,1.1rem+2vw,1.875rem)] font-semibold tracking-tight">
            Sell your car
          </h1>
          <p className="text-muted-foreground">
            This account is suspended and cannot post new listings.
            {status.suspendedReason ? ` Reason: ${status.suspendedReason}` : ""}
          </p>
          <p className="text-sm">
            <Link href="/account/listings" className="font-medium underline-offset-4 hover:underline">
              View your listings
            </Link>
          </p>
        </div>
      );
    }
  }

  const [makes, catalog] = await Promise.all([getVehicleMakes(), getSellCatalog()]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="space-y-2">
        <h1 className="text-[clamp(1.5rem,1.1rem+2vw,1.875rem)] font-semibold tracking-tight">
          {listingId ? (editingDraft ? "Finish this listing" : "Edit listing") : "Sell your car"}
        </h1>
        <p className="text-muted-foreground">
          {listingId
            ? fromAdmin
              ? "Update this listing as staff. Changes apply even if you are not the seller."
              : "Update the vehicle details, photos, price, or contact information."
            : "List in a few steps: vehicle details, photos, price, and your contact information. Prices are in Malawian Kwacha."}
        </p>
        <p className="text-sm">
          <Link
            href={listingsHref}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {fromAdmin ? "Back to listings moderation" : "View your listings dashboard"}
          </Link>
        </p>
      </div>
      {editingListing ? <EditListingSummary listing={editingListing} /> : null}
      <SellForm
        defaultValues={{ ...listingFormDefaults, ...defaultValues }}
        listingId={listingId}
        vehicleNumber={editingListing?.vehicleNumber}
        redirectTo={listingsHref}
        makes={makes}
        catalog={catalog}
        signedIn={true}
      />
    </div>
  );
}
