"use client";

import { useMemo, useState, type ComponentProps } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Plus } from "lucide-react";
import { EmptyState } from "@/components/account/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import type { AccountListingRow } from "@/lib/account";
import { LISTING_STATUS_LABEL } from "@/lib/listing-featured";
import { listingDisplayParts } from "@/lib/listing-title";
import { cn } from "@/lib/utils";
import { formatVehicleId } from "@/lib/vehicle-id";

type StatusFilter = "all" | AccountListingRow["status"];

const STATUS_VARIANT: Record<AccountListingRow["status"], "success" | "copper" | "secondary" | "outline"> = {
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

export function AccountListingsTable({ listings }: { listings: AccountListingRow[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(
    () => (filter === "all" ? listings : listings.filter((item) => item.status === filter)),
    [filter, listings],
  );

  async function run(action: () => Promise<void>) {
    setPending(true);
    setError(null);
    try {
      await action();
      router.refresh();
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Could not update listings.");
    } finally {
      setPending(false);
    }
  }

  async function patchListing(id: string, body: Record<string, unknown>) {
    const response = await fetch(`/api/account/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await readError(response);
  }

  async function deleteListing(id: string) {
    if (!window.confirm("Delete this listing? This cannot be undone.")) return;
    await run(async () => {
      const response = await fetch(`/api/account/listings/${id}`, { method: "DELETE" });
      await readError(response);
    });
  }

  if (listings.length === 0) {
    return (
      <EmptyState
        title="No listings yet"
        description="Add your first vehicle to start appearing in search."
        action={{ href: "/sell?from=account", label: "Add new listing" }}
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
          <Link href="/sell?from=account">
            <Plus className="size-4" />
            Add new listing
          </Link>
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="hidden overflow-hidden rounded-lg border bg-card nav:block">
        <Table>
          <TableHeader>
            <TableRow>
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
                pending={pending}
                onMarkSold={() => void run(() => patchListing(listing.id, { status: "sold" }))}
                onRenew={() => void run(() => patchListing(listing.id, { renew: true }))}
                onDelete={() => void deleteListing(listing.id)}
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
            pending={pending}
            onMarkSold={() => void run(() => patchListing(listing.id, { status: "sold" }))}
            onRenew={() => void run(() => patchListing(listing.id, { renew: true }))}
            onDelete={() => void deleteListing(listing.id)}
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
  onRenew,
  onDelete,
}: {
  listing: AccountListingRow;
  pending: boolean;
  onMarkSold: () => void;
  onRenew: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" size="icon" variant="ghost" disabled={pending} aria-label="Listing actions">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem asChild>
          <Link href={`/sell?listingId=${listing.id}&from=account`}>Edit</Link>
        </DropdownMenuItem>
        {listing.status === "expired" ? (
          <DropdownMenuItem onSelect={onRenew}>Renew</DropdownMenuItem>
        ) : null}
        {listing.status !== "sold" ? (
          <DropdownMenuItem onSelect={onMarkSold}>Mark as sold</DropdownMenuItem>
        ) : null}
        {/* TODO: Offer individuals a paid "boost this listing" option (dealer featuring is the current paid promotion path). */}
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
  ...actions
}: {
  listing: AccountListingRow;
} & Omit<ComponentProps<typeof ListingActions>, "listing">) {
  const { headline } = listingDisplayParts(listing);
  const image = listing.images[0];

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
            {image ? (
              <Image src={image} alt="" fill className="object-cover" sizes="64px" />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="min-w-0 truncate font-medium">{headline}</p>
            <p className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
              {formatVehicleId(listing.vehicleNumber)}
            </p>
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
        <div className="flex items-center justify-end gap-1">
          {listing.status === "expired" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={actions.pending}
              onClick={actions.onRenew}
            >
              Renew
            </Button>
          ) : null}
          <ListingActions listing={listing} {...actions} />
        </div>
      </TableCell>
    </TableRow>
  );
}

function MobileListingCard({
  listing,
  ...actions
}: {
  listing: AccountListingRow;
} & Omit<ComponentProps<typeof ListingActions>, "listing">) {
  const { headline } = listingDisplayParts(listing);
  const image = listing.images[0];

  return (
    <div className={cn("rounded-lg border bg-card p-3")}>
      <div className="flex items-start gap-3">
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
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {listing.views} views · {listing.enquiries} enquiries · {formatDate(listing.createdAt)}
          </p>
          {listing.status === "expired" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-2"
              disabled={actions.pending}
              onClick={actions.onRenew}
            >
              Renew
            </Button>
          ) : null}
        </div>
        <ListingActions listing={listing} {...actions} />
      </div>
    </div>
  );
}
