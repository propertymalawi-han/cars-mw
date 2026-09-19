"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  MoreHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  ADMIN_LISTINGS_PAGE_SIZE,
  adminListingsHref,
  type AdminListingFilters,
  type AdminListingRow,
  type AdminListingSort,
  type AdminListingsHrefContext,
} from "@/lib/admin-listings";
import { formatMWK, formatNumber } from "@/lib/currency";
import { formatDate } from "@/lib/format-date";
import {
  FEATURE_PERIOD_DAYS,
  LISTING_STATUS_LABEL,
  LISTING_STATUS_VARIANT,
  isListingFeatured,
} from "@/lib/listing-featured";
import { listingDisplayParts } from "@/lib/listing-title";
import { cn } from "@/lib/utils";
import { formatVehicleId } from "@/lib/vehicle-id";

type DialogState =
  | { type: "mute"; listing: AdminListingRow }
  | { type: "delete"; listing: AdminListingRow }
  | null;

async function readError(response: Response) {
  const json = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(json.error ?? "Could not update that listing.");
  }
}

function sortHref(
  filters: AdminListingFilters,
  column: AdminListingSort,
  hrefContext?: AdminListingsHrefContext,
) {
  const nextDir =
    filters.sort === column
      ? filters.dir === "asc"
        ? "desc"
        : "asc"
      : column === "title" || column === "make" || column === "seller" || column === "status"
        ? "asc"
        : "desc";
  return adminListingsHref({ ...filters, sort: column, dir: nextDir, page: 1 }, hrefContext);
}

function SortHeader({
  column,
  filters,
  hrefContext,
  children,
  className,
}: {
  column: AdminListingSort;
  filters: AdminListingFilters;
  hrefContext?: AdminListingsHrefContext;
  children: string;
  className?: string;
}) {
  const active = filters.sort === column;
  const Icon = !active ? ArrowUpDown : filters.dir === "asc" ? ArrowUp : ArrowDown;

  return (
    <TableHead className={cn("h-9", className)}>
      <Link
        href={sortHref(filters, column, hrefContext)}
        className="inline-flex items-center gap-1 hover:text-foreground"
        aria-label={`Sort by ${children}`}
      >
        {children}
        <Icon className="size-3.5" />
      </Link>
    </TableHead>
  );
}

export function AdminListingsDataTable({
  listings,
  total,
  pageCount,
  filters,
  hrefContext,
}: {
  listings: AdminListingRow[];
  total: number;
  pageCount: number;
  filters: AdminListingFilters;
  hrefContext?: AdminListingsHrefContext;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [muteReason, setMuteReason] = useState("");

  const page = Math.min(Math.max(filters.page, 1), pageCount);
  const from = total === 0 ? 0 : (page - 1) * ADMIN_LISTINGS_PAGE_SIZE + 1;
  const to = Math.min(page * ADMIN_LISTINGS_PAGE_SIZE, total);

  async function run(action: () => Promise<void>) {
    setPending(true);
    setError(null);
    try {
      await action();
      setDialog(null);
      setMuteReason("");
      router.refresh();
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Could not update that listing.");
    } finally {
      setPending(false);
    }
  }

  async function patchListing(id: string, body: Record<string, unknown>) {
    const response = await fetch(`/api/admin/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await readError(response);
  }

  return (
    <div className="space-y-0">
      {error ? (
        <p className="border-b px-3 py-2 text-sm text-destructive">{error}</p>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="h-9 w-[4.5rem]">Photo</TableHead>
            <SortHeader column="title" filters={filters} hrefContext={hrefContext}>
              Title
            </SortHeader>
            <SortHeader column="make" filters={filters} hrefContext={hrefContext}>
              Make / model
            </SortHeader>
            <SortHeader column="price" filters={filters} hrefContext={hrefContext}>
              Price
            </SortHeader>
            <SortHeader column="seller" filters={filters} hrefContext={hrefContext}>
              Seller
            </SortHeader>
            <SortHeader column="status" filters={filters} hrefContext={hrefContext}>
              Status
            </SortHeader>
            <SortHeader column="views" filters={filters} hrefContext={hrefContext} className="text-right [&>a]:justify-end">
              Views
            </SortHeader>
            <SortHeader column="enquiries" filters={filters} hrefContext={hrefContext} className="text-right [&>a]:justify-end">
              Enquiries
            </SortHeader>
            <SortHeader column="createdAt" filters={filters} hrefContext={hrefContext}>
              Date posted
            </SortHeader>
            <TableHead className="h-9 w-12">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {listings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="py-10 text-center text-sm text-muted-foreground">
                No listings match these filters.
              </TableCell>
            </TableRow>
          ) : (
            listings.map((listing) => {
              const { headline } = listingDisplayParts(listing);
              const image = listing.images[0];
              const featured = isListingFeatured(listing.featuredUntil);

              return (
                <TableRow key={listing.id}>
                  <TableCell className="py-2">
                    <div className="relative h-12 w-16 overflow-hidden rounded-md bg-muted">
                      {image ? (
                        <Image src={image} alt="" fill className="object-cover" sizes="64px" />
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[16rem] py-2">
                    <p className="truncate font-medium">{headline}</p>
                    <p className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                      {formatVehicleId(listing.vehicleNumber)}
                    </p>
                    {featured ? (
                      <Badge variant="copper" className="mt-1 px-1.5 py-0 text-[0.62rem]">
                        Featured
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="whitespace-nowrap py-2">
                    {listing.make} {listing.model}
                  </TableCell>
                  <TableCell className="whitespace-nowrap py-2 font-medium">
                    {formatMWK(listing.price)}
                  </TableCell>
                  <TableCell className="py-2">
                    <p className="truncate">{listing.sellerName}</p>
                    <Badge variant="secondary" className="mt-1 px-1.5 py-0 text-[0.62rem]">
                      {listing.sellerType === "dealer" ? "Dealer" : "Individual"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2">
                    <Badge variant={LISTING_STATUS_VARIANT[listing.status]}>
                      {LISTING_STATUS_LABEL[listing.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2 text-right tabular-nums">
                    {formatNumber(listing.views)}
                  </TableCell>
                  <TableCell className="py-2 text-right tabular-nums">
                    {formatNumber(listing.enquiries)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap py-2 text-muted-foreground">
                    {formatDate(listing.createdAt)}
                  </TableCell>
                  <TableCell className="py-2">
                    <ListingActions
                      listing={listing}
                      featured={featured}
                      pending={pending}
                      onMute={() => {
                        setMuteReason("");
                        setDialog({ type: "mute", listing });
                      }}
                      onUnmute={() => void run(() => patchListing(listing.id, { action: "unmute" }))}
                      onDelete={() => setDialog({ type: "delete", listing })}
                      onFeature={(days) =>
                        void run(() => patchListing(listing.id, { action: "feature", days }))
                      }
                      onUnfeature={() =>
                        void run(() => patchListing(listing.id, { action: "unfeature" }))
                      }
                    />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <div className="flex flex-col gap-2 border-t px-3 py-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          {total === 0
            ? "0 listings"
            : `Showing ${formatNumber(from)}–${formatNumber(to)} of ${formatNumber(total)}`}
        </p>
        {pageCount > 1 ? (
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className={cn("h-8", page <= 1 && "pointer-events-none opacity-50")}
            >
              <Link
                href={adminListingsHref({ ...filters, page: Math.max(1, page - 1) }, hrefContext)}
                aria-disabled={page <= 1}
              >
                Previous
              </Link>
            </Button>
            <span className="tabular-nums">
              Page {page} of {pageCount}
            </span>
            <Button
              asChild
              variant="outline"
              size="sm"
              className={cn("h-8", page >= pageCount && "pointer-events-none opacity-50")}
            >
              <Link
                href={adminListingsHref({ ...filters, page: Math.min(pageCount, page + 1) }, hrefContext)}
                aria-disabled={page >= pageCount}
              >
                Next
              </Link>
            </Button>
          </div>
        ) : null}
      </div>

      <Dialog
        open={dialog?.type === "mute"}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mute listing</DialogTitle>
            <DialogDescription>
              Hidden from public search and listing pages, but not deleted. Sellers
              cannot change it until it is unmuted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="mute-reason">Reason</Label>
            <Textarea
              id="mute-reason"
              value={muteReason}
              onChange={(event) => setMuteReason(event.target.value)}
              placeholder="Why is this listing being muted?"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={pending || muteReason.trim().length === 0 || !dialog}
              onClick={() => {
                if (!dialog || dialog.type !== "mute") return;
                void run(() =>
                  patchListing(dialog.listing.id, {
                    action: "mute",
                    reason: muteReason.trim(),
                  }),
                );
              }}
            >
              Mute listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog?.type === "delete"}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete listing</DialogTitle>
            <DialogDescription>
              This removes the listing from public view immediately. It is a soft
              delete, so the record stays in the database with a deleted timestamp.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending || !dialog}
              onClick={() => {
                if (!dialog || dialog.type !== "delete") return;
                void run(() => patchListing(dialog.listing.id, { action: "delete" }));
              }}
            >
              Delete listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ListingActions({
  listing,
  featured,
  pending,
  onMute,
  onUnmute,
  onDelete,
  onFeature,
  onUnfeature,
}: {
  listing: AdminListingRow;
  featured: boolean;
  pending: boolean;
  onMute: () => void;
  onUnmute: () => void;
  onDelete: () => void;
  onFeature: (days: (typeof FEATURE_PERIOD_DAYS)[number]) => void;
  onUnfeature: () => void;
}) {
  const muted = listing.status === "muted";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" size="icon" variant="ghost" disabled={pending} aria-label="Listing actions">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem asChild>
          <a href={`/listings/${listing.id}`} target="_blank" rel="noreferrer">
            View
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/sell?listingId=${listing.id}&from=admin`}>Edit</Link>
        </DropdownMenuItem>
        {muted ? (
          <DropdownMenuItem onSelect={onUnmute}>Unmute</DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={onMute}>Mute</DropdownMenuItem>
        )}
        {featured ? (
          <DropdownMenuItem onSelect={onUnfeature}>Unfeature</DropdownMenuItem>
        ) : (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Feature</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {FEATURE_PERIOD_DAYS.map((days) => (
                <DropdownMenuItem key={days} onSelect={() => onFeature(days)}>
                  Feature for {days} days
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={onDelete}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
