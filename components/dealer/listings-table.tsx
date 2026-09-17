"use client";

import { useMemo, useState, type ComponentProps } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Plus } from "lucide-react";
import { EmptyState } from "@/components/account/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatMWK } from "@/lib/currency";
import { formatDate } from "@/lib/format-date";
import type { DealerListingRow } from "@/lib/dealer";
import {
  FEATURE_PERIOD_DAYS,
  LISTING_STATUS_LABEL,
  isListingFeatured,
} from "@/lib/listing-featured";
import { listingDisplayParts } from "@/lib/listing-title";
import { cn } from "@/lib/utils";
import { formatVehicleId } from "@/lib/vehicle-id";

type StatusFilter = "all" | DealerListingRow["status"];

const STATUS_VARIANT: Record<DealerListingRow["status"], "success" | "copper" | "secondary" | "outline"> = {
  active: "success",
  sold: "copper",
  draft: "secondary",
  expired: "outline",
};

async function readError(response: Response) {
  const json = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(json.error ?? "Could not update that listing.");
  }
}

export function DealerListingsTable({ listings }: { listings: DealerListingRow[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(
    () => (filter === "all" ? listings : listings.filter((item) => item.status === filter)),
    [filter, listings],
  );

  const visibleIds = visible.map((item) => item.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const someVisibleSelected = visibleIds.some((id) => selected.has(id));

  function toggleAll(next: boolean) {
    setSelected((current) => {
      const copy = new Set(current);
      for (const id of visibleIds) {
        if (next) copy.add(id);
        else copy.delete(id);
      }
      return copy;
    });
  }

  function toggleOne(id: string, next: boolean) {
    setSelected((current) => {
      const copy = new Set(current);
      if (next) copy.add(id);
      else copy.delete(id);
      return copy;
    });
  }

  async function run(action: () => Promise<void>) {
    setPending(true);
    setError(null);
    try {
      await action();
      setSelected(new Set());
      router.refresh();
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Could not update listings.");
    } finally {
      setPending(false);
    }
  }

  async function patchListing(id: string, body: Record<string, unknown>) {
    const response = await fetch(`/api/dealer/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await readError(response);
  }

  async function bulk(action: "sold" | "delete") {
    if (action === "delete" && !window.confirm("Delete the selected listings? This cannot be undone.")) {
      return;
    }
    await run(async () => {
      const response = await fetch("/api/dealer/listings/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), action }),
      });
      await readError(response);
    });
  }

  async function deleteListing(id: string) {
    if (!window.confirm("Delete this listing? This cannot be undone.")) return;
    await run(async () => {
      const response = await fetch(`/api/dealer/listings/${id}`, { method: "DELETE" });
      await readError(response);
    });
  }

  if (listings.length === 0) {
    return (
      <EmptyState
        title="No listings yet"
        description="Add your first vehicle to start appearing in search."
        action={{ href: "/sell?from=dealer", label: "Add new listing" }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={(value) => setFilter(value as StatusFilter)}>
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="sold">Sold</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="expired">Expired</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button asChild variant="copper">
          <Link href="/sell?from=dealer">
            <Plus className="size-4" />
            Add new listing
          </Link>
        </Button>
      </div>

      {selected.size > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card px-3 py-2">
          <p className="mr-auto text-sm font-medium">{selected.size} selected</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => void bulk("sold")}
          >
            Mark as sold
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={() => void bulk("delete")}
          >
            Delete
          </Button>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}

      <div className="hidden overflow-hidden rounded-lg border bg-card nav:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                  onCheckedChange={(value) => toggleAll(value === true)}
                  aria-label="Select all listings"
                />
              </TableHead>
              <TableHead>Listing</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead className="text-right">Enquiries</TableHead>
              <TableHead>Posted</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((listing) => (
              <ListingTableRow
                key={listing.id}
                listing={listing}
                checked={selected.has(listing.id)}
                onCheckedChange={(next) => toggleOne(listing.id, next)}
                pending={pending}
                onMarkSold={() => void run(() => patchListing(listing.id, { status: "sold" }))}
                onDuplicate={() =>
                  void run(async () => {
                    const response = await fetch(`/api/dealer/listings/${listing.id}/duplicate`, {
                      method: "POST",
                    });
                    const json = (await response.json()) as { id?: string; error?: string };
                    if (!response.ok || !json.id) {
                      throw new Error(json.error ?? "Could not duplicate that listing.");
                    }
                    router.push(`/sell?listingId=${json.id}&from=dealer`);
                  })
                }
                onDelete={() => void deleteListing(listing.id)}
                onFeature={(days) => void run(() => patchListing(listing.id, { featured: true, days }))}
                onUnfeature={() => void run(() => patchListing(listing.id, { featured: false }))}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 nav:hidden">
        {visible.map((listing) => (
          <MobileListingCard
            key={listing.id}
            listing={listing}
            checked={selected.has(listing.id)}
            onCheckedChange={(next) => toggleOne(listing.id, next)}
            pending={pending}
            onMarkSold={() => void run(() => patchListing(listing.id, { status: "sold" }))}
            onDuplicate={() =>
              void run(async () => {
                const response = await fetch(`/api/dealer/listings/${listing.id}/duplicate`, {
                  method: "POST",
                });
                const json = (await response.json()) as { id?: string; error?: string };
                if (!response.ok || !json.id) {
                  throw new Error(json.error ?? "Could not duplicate that listing.");
                }
                router.push(`/sell?listingId=${json.id}&from=dealer`);
              })
            }
            onDelete={() => void deleteListing(listing.id)}
            onFeature={(days) => void run(() => patchListing(listing.id, { featured: true, days }))}
            onUnfeature={() => void run(() => patchListing(listing.id, { featured: false }))}
          />
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">No listings in this status.</p>
      ) : null}
    </div>
  );
}

function ListingActions({
  listing,
  pending,
  onMarkSold,
  onDuplicate,
  onDelete,
  onFeature,
  onUnfeature,
}: {
  listing: DealerListingRow;
  pending: boolean;
  onMarkSold: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onFeature: (days: (typeof FEATURE_PERIOD_DAYS)[number]) => void;
  onUnfeature: () => void;
}) {
  const featured = isListingFeatured(listing.featuredUntil);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" size="icon" variant="ghost" disabled={pending} aria-label="Listing actions">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem asChild>
          <Link href={`/sell?listingId=${listing.id}&from=dealer`}>Edit</Link>
        </DropdownMenuItem>
        {listing.status !== "sold" ? (
          <DropdownMenuItem onSelect={onMarkSold}>Mark as sold</DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onSelect={onDuplicate}>Duplicate</DropdownMenuItem>
        {featured ? (
          <DropdownMenuItem onSelect={onUnfeature}>Remove feature</DropdownMenuItem>
        ) : (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Promote / Feature</DropdownMenuSubTrigger>
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

function ListingTableRow({
  listing,
  checked,
  onCheckedChange,
  ...actions
}: {
  listing: DealerListingRow;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
} & Omit<ComponentProps<typeof ListingActions>, "listing">) {
  const { headline } = listingDisplayParts(listing);
  const image = listing.images[0];
  const featured = isListingFeatured(listing.featuredUntil);

  return (
    <TableRow data-state={checked ? "selected" : undefined}>
      <TableCell>
        <Checkbox
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          aria-label={`Select ${headline}`}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
            {image ? (
              <Image src={image} alt="" fill className="object-cover" sizes="64px" />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{headline}</p>
            <p className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
              {formatVehicleId(listing.vehicleNumber)}
            </p>
            {featured ? (
              <Badge variant="copper" className="mt-1 px-1.5 py-0 text-[0.65rem]">
                Featured
              </Badge>
            ) : null}
          </div>
        </div>
      </TableCell>
      <TableCell className="whitespace-nowrap font-medium">{formatMWK(listing.price)}</TableCell>
      <TableCell>
        <Badge variant={STATUS_VARIANT[listing.status]}>
          {LISTING_STATUS_LABEL[listing.status]}
        </Badge>
      </TableCell>
      <TableCell className="text-right tabular-nums">{listing.views}</TableCell>
      <TableCell className="text-right tabular-nums">{listing.enquiries}</TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {formatDate(listing.createdAt)}
      </TableCell>
      <TableCell>
        <ListingActions listing={listing} {...actions} />
      </TableCell>
    </TableRow>
  );
}

function MobileListingCard({
  listing,
  checked,
  onCheckedChange,
  ...actions
}: {
  listing: DealerListingRow;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
} & Omit<ComponentProps<typeof ListingActions>, "listing">) {
  const { headline } = listingDisplayParts(listing);
  const image = listing.images[0];
  const featured = isListingFeatured(listing.featuredUntil);

  return (
    <div className={cn("rounded-lg border bg-card p-3", checked && "bg-muted/50")}>
      <div className="flex items-start gap-3">
        <Checkbox
          className="mt-1"
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          aria-label={`Select ${headline}`}
        />
        <div className="relative h-14 w-[4.5rem] shrink-0 overflow-hidden rounded-md bg-muted">
          {image ? (
            <Image src={image} alt="" fill className="object-cover" sizes="72px" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-snug">{headline}</p>
          <p className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
            {formatVehicleId(listing.vehicleNumber)}
          </p>
          <p className="mt-0.5 text-sm font-semibold">{formatMWK(listing.price)}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant={STATUS_VARIANT[listing.status]}>
              {LISTING_STATUS_LABEL[listing.status]}
            </Badge>
            {featured ? <Badge variant="copper">Featured</Badge> : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {listing.views} views · {listing.enquiries} enquiries · {formatDate(listing.createdAt)}
          </p>
        </div>
        <ListingActions listing={listing} {...actions} />
      </div>
    </div>
  );
}
