"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { EnquiryStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/account/empty-state";
import { formatDateTime } from "@/lib/format-date";
import { listingDisplayParts } from "@/lib/listing-title";
import { cn } from "@/lib/utils";

export type DealerEnquiryItem = {
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
  buyer: { id: string; name: string; avatarUrl: string | null };
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

export function DealerEnquiryInbox({
  enquiries,
  userId,
  initialOpenId,
}: {
  enquiries: DealerEnquiryItem[];
  userId: string;
  initialOpenId?: string;
}) {
  const router = useRouter();
  const [openId, setOpenId] = useState(initialOpenId ?? enquiries[0]?.id ?? null);
  const open = useMemo(
    () => enquiries.find((item) => item.id === openId) ?? null,
    [enquiries, openId],
  );

  if (enquiries.length === 0) {
    return (
      <EmptyState
        title="No enquiries yet"
        description="When buyers message you about a listing, the conversation will show up here."
      />
    );
  }

  return (
    <div className="grid gap-4 nav:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <div className="space-y-2">
        {enquiries.map((enquiry) => {
          const { headline } = listingDisplayParts(enquiry.listing);
          const image = enquiry.listing.images[0];
          const active = enquiry.id === openId;
          return (
            <button
              key={enquiry.id}
              type="button"
              onClick={() => setOpenId(enquiry.id)}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg border bg-card p-3 text-left transition-colors",
                active ? "border-copper/40 bg-copper/5" : "hover:bg-muted/40",
              )}
            >
              <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                {image ? (
                  <Image src={image} alt="" fill className="object-cover" sizes="64px" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{headline}</p>
                <p className="truncate text-xs text-muted-foreground">{enquiry.buyer.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant={statusVariant(enquiry.status)}>
                    {STATUS_LABEL[enquiry.status]}
                  </Badge>
                  <span className="text-[0.7rem] text-muted-foreground">
                    {formatDateTime(enquiry.createdAt)}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <EnquiryThread
        enquiry={open}
        userId={userId}
        onChanged={() => router.refresh()}
      />
    </div>
  );
}

function EnquiryThread({
  enquiry,
  userId,
  onChanged,
}: {
  enquiry: DealerEnquiryItem | null;
  userId: string;
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

  async function setStatus(status: EnquiryStatus) {
    if (!enquiry) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/account/enquiries/${enquiry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(json.error ?? "Could not update this enquiry.");
      }
      onChanged();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Could not update this enquiry.");
    } finally {
      setPending(false);
    }
  }

  if (!enquiry) {
    return (
      <div className="rounded-lg border bg-card p-8 text-sm text-muted-foreground">
        Select an enquiry to reply.
      </div>
    );
  }

  return (
    <div className="flex min-h-[28rem] flex-col rounded-lg border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <p className="font-semibold">{headline}</p>
          <p className="text-sm text-muted-foreground">{enquiry.buyer.name}</p>
        </div>
        <Select
          value={enquiry.status}
          onValueChange={(value) => void setStatus(value as EnquiryStatus)}
          disabled={pending}
        >
          <SelectTrigger className="w-[9.5rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
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

      {error ? <p className="px-4 text-sm text-destructive">{error}</p> : null}

      {enquiry.status === "closed" ? (
        <p className="border-t px-4 py-3 text-sm text-muted-foreground">
          This enquiry is closed.
        </p>
      ) : (
        <div className="space-y-3 border-t px-4 py-3">
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write a reply…"
            rows={3}
          />
          <div className="flex justify-end">
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
    </div>
  );
}
