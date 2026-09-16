"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { withReturnTo } from "@/lib/return-to";

export function SendEnquiryForm({
  listingId,
  returnTo,
  existingEnquiryId,
}: {
  listingId: string;
  returnTo: string;
  existingEnquiryId?: string;
}) {
  const router = useRouter();
  const { status } = useSession();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (existingEnquiryId) {
    return (
      <Button asChild variant="outline" className="w-full">
        <Link href={`/account/enquiries?open=${existingEnquiryId}`}>View your enquiry</Link>
      </Button>
    );
  }

  if (status !== "authenticated") {
    return (
      <Button asChild variant="outline" className="w-full">
        <Link href={withReturnTo("/sign-in", returnTo)}>Sign in to send an enquiry</Link>
      </Button>
    );
  }

  async function submit() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/account/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, message }),
      });
      const json = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !json.id) {
        throw new Error(json.error ?? "Could not send that enquiry.");
      }
      router.push(`/account/enquiries?open=${json.id}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not send that enquiry.");
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Send an enquiry</h3>
      <Textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Ask about price, availability, or a viewing…"
        rows={4}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button
        type="button"
        className="w-full"
        disabled={pending || message.trim().length < 10}
        onClick={() => void submit()}
      >
        {pending ? "Sending…" : "Send enquiry"}
      </Button>
    </div>
  );
}
