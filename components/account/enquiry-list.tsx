"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/account/empty-state";
import { formatDateTime } from "@/lib/format-date";
import { listingDisplayParts } from "@/lib/listing-title";
import { cn } from "@/lib/utils";
import type { EnquiryStatus } from "@prisma/client";

export type EnquiryThreadItem = {
  id: string;
  status: EnquiryStatus;
  message: string;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    make: string;
    model: string;
    year: number;
    images: string[];
  };
  dealer: { id: string; name: string } | null;
  messages: {
    id: string;
    senderId: string;
    body: string;
    createdAt: string;
    sender: { id: string; name: string; avatarUrl: string | null };
  }[];
};

const STATUS_LABEL: Record<EnquiryStatus, string> = {
  pending: "Pending",
  replied: "Replied",
  closed: "Closed",
};

function statusVariant(status: EnquiryStatus) {
  if (status === "replied") return "success" as const;
  if (status === "closed") return "outline" as const;
  return "secondary" as const;
}

function EnquiryRow({
  enquiry,
  onOpen,
  layout,
}: {
  enquiry: EnquiryThreadItem;
  onOpen: () => void;
  layout: "table" | "card";
}) {
  const { headline } = listingDisplayParts(enquiry.listing);
  const image = enquiry.listing.images[0];

  if (layout === "card") {
    return (
      <Card>
        <button type="button" className="w-full text-left" onClick={onOpen}>
          <CardHeader className="flex-row items-start gap-3 space-y-0">
            <div className="relative h-14 w-[4.5rem] shrink-0 overflow-hidden rounded-md bg-muted">
              {image ? (
                <Image src={image} alt="" fill className="object-cover" sizes="72px" />
              ) : null}
            </div>
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-base">{headline}</CardTitle>
              <CardDescription>
                {enquiry.dealer?.name ?? "Private seller"} · {formatDateTime(enquiry.createdAt)}
              </CardDescription>
              <Badge variant={statusVariant(enquiry.status)}>
                {STATUS_LABEL[enquiry.status]}
              </Badge>
            </div>
          </CardHeader>
        </button>
      </Card>
    );
  }

  return (
    <TableRow className="cursor-pointer" onClick={onOpen}>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
            {image ? (
              <Image src={image} alt="" fill className="object-cover" sizes="64px" />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{headline}</p>
            <p className="truncate text-xs text-muted-foreground">
              {enquiry.dealer?.name ?? "Private seller"}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {formatDateTime(enquiry.createdAt)}
      </TableCell>
      <TableCell>
        <Badge variant={statusVariant(enquiry.status)}>
          {STATUS_LABEL[enquiry.status]}
        </Badge>
      </TableCell>
    </TableRow>
  );
}

export function EnquiryList({
  enquiries,
  userId,
  initialOpenId,
}: {
  enquiries: EnquiryThreadItem[];
  userId: string;
  initialOpenId?: string;
}) {
  const router = useRouter();
  const [openId, setOpenId] = useState(initialOpenId ?? null);
  const open = useMemo(
    () => enquiries.find((item) => item.id === openId) ?? null,
    [enquiries, openId],
  );

  if (enquiries.length === 0) {
    return (
      <EmptyState
        title="No enquiries yet"
        description="Message a seller from a listing page and the conversation will show up here."
        action={{ href: "/listings", label: "Browse cars" }}
      />
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-lg border bg-card nav:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Listing</TableHead>
              <TableHead>Date sent</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enquiries.map((enquiry) => (
              <EnquiryRow
                key={enquiry.id}
                enquiry={enquiry}
                layout="table"
                onOpen={() => setOpenId(enquiry.id)}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 nav:hidden">
        {enquiries.map((enquiry) => (
          <EnquiryRow
            key={enquiry.id}
            enquiry={enquiry}
            layout="card"
            onOpen={() => setOpenId(enquiry.id)}
          />
        ))}
      </div>

      <EnquiryThreadSheet
        enquiry={open}
        userId={userId}
        onClose={() => setOpenId(null)}
        onChanged={() => router.refresh()}
      />
    </>
  );
}

function EnquiryThreadSheet({
  enquiry,
  userId,
  onClose,
  onChanged,
}: {
  enquiry: EnquiryThreadItem | null;
  userId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const headline = enquiry ? listingDisplayParts(enquiry.listing).headline : "";

  async function sendMessage() {
    if (!enquiry) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/account/enquiries/${enquiry.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(json.error ?? "Could not send that message.");
      }
      setBody("");
      onChanged();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Could not send that message.");
    } finally {
      setPending(false);
    }
  }

  async function closeEnquiry() {
    if (!enquiry) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/account/enquiries/${enquiry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(json.error ?? "Could not close this enquiry.");
      }
      onChanged();
    } catch (closeError) {
      setError(closeError instanceof Error ? closeError.message : "Could not close this enquiry.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Sheet open={Boolean(enquiry)} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="flex flex-col sm:max-w-lg">
        {enquiry ? (
          <>
            <SheetHeader>
              <SheetTitle>{headline}</SheetTitle>
              <SheetDescription>
                {enquiry.dealer?.name ?? "Private seller"} ·{" "}
                <Badge variant={statusVariant(enquiry.status)} className="align-middle">
                  {STATUS_LABEL[enquiry.status]}
                </Badge>
              </SheetDescription>
            </SheetHeader>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto py-2">
              {enquiry.messages.map((message) => {
                const mine = message.senderId === userId;
                return (
                  <div
                    key={message.id}
                    className={cn("flex", mine ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                        mine ? "bg-copper text-copper-foreground" : "bg-muted",
                      )}
                    >
                      <p className="mb-1 text-[0.7rem] font-medium opacity-80">
                        {mine ? "You" : message.sender.name}
                      </p>
                      <p className="whitespace-pre-wrap">{message.body}</p>
                      <p className="mt-1 text-[0.7rem] opacity-70">
                        {formatDateTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}

            {enquiry.status === "closed" ? (
              <p className="text-sm text-muted-foreground">This enquiry is closed.</p>
            ) : (
              <div className="space-y-3">
                <Textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="Write a follow-up…"
                  rows={3}
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pending}
                    onClick={() => void closeEnquiry()}
                  >
                    Mark as closed
                  </Button>
                  <Button
                    type="button"
                    variant="copper"
                    disabled={pending || body.trim().length === 0}
                    onClick={() => void sendMessage()}
                  >
                    {pending ? "Sending…" : "Send"}
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
