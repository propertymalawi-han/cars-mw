"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FavouriteButton } from "@/components/account/favourite-button";
import { SendEnquiryForm } from "@/components/account/send-enquiry-form";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

type ListingBuyerState = {
  saved: boolean;
  enquiryId?: string;
};

const buyerStateCache = new Map<string, ListingBuyerState>();
const buyerStateInflight = new Map<string, Promise<ListingBuyerState>>();

function loadListingBuyerState(listingId: string) {
  const cached = buyerStateCache.get(listingId);
  if (cached) return Promise.resolve(cached);

  const inflight = buyerStateInflight.get(listingId);
  if (inflight) return inflight;

  const request = fetch(`/api/account/listing-state?listingId=${encodeURIComponent(listingId)}`)
    .then((response) => (response.ok ? response.json() : null))
    .then((json: { saved?: boolean; enquiryId?: string | null } | null) => {
      const next: ListingBuyerState = {
        saved: Boolean(json?.saved),
        enquiryId: json?.enquiryId ?? undefined,
      };
      buyerStateCache.set(listingId, next);
      return next;
    })
    .finally(() => {
      buyerStateInflight.delete(listingId);
    });

  buyerStateInflight.set(listingId, request);
  return request;
}

export function ListingFavourite({ listingId }: { listingId: string }) {
  const { status } = useSession();
  const state = useListingBuyerState(listingId, status === "authenticated");

  if (status !== "authenticated") return null;
  if (!state.ready) return <Skeleton className="size-10 shrink-0 rounded-full" />;

  return <FavouriteButton listingId={listingId} saved={state.saved} />;
}

export function ListingEnquiry({
  listingId,
  sellerId,
  listingActive,
  returnTo,
}: {
  listingId: string;
  sellerId: string;
  listingActive: boolean;
  returnTo: string;
}) {
  const { data: session, status } = useSession();
  const isOwner = session?.user?.id === sellerId;
  const state = useListingBuyerState(listingId, status === "authenticated" && !isOwner);

  if (!listingActive || isOwner) return null;
  if (status === "authenticated" && !state.ready) {
    return (
      <>
        <Separator />
        <Skeleton className="h-11 w-full" />
      </>
    );
  }

  return (
    <>
      <Separator />
      <SendEnquiryForm
        listingId={listingId}
        returnTo={returnTo}
        existingEnquiryId={state.enquiryId}
      />
    </>
  );
}

function useListingBuyerState(listingId: string, enabled: boolean) {
  const cached = buyerStateCache.get(listingId);
  const [saved, setSaved] = useState(cached?.saved ?? false);
  const [enquiryId, setEnquiryId] = useState<string | undefined>(cached?.enquiryId);
  const [ready, setReady] = useState(!enabled || Boolean(cached));

  useEffect(() => {
    if (!enabled) {
      setReady(true);
      return;
    }

    let cancelled = false;
    void loadListingBuyerState(listingId).then((next) => {
      if (cancelled) return;
      setSaved(next.saved);
      setEnquiryId(next.enquiryId);
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, listingId]);

  return { saved, enquiryId, ready };
}
