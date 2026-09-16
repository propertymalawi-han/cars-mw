"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FavouriteButton({
  listingId,
  saved,
  onSavedChange,
  className,
}: {
  listingId: string;
  saved: boolean;
  onSavedChange?: (saved: boolean) => void;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [isSaved, setIsSaved] = useState(saved);

  async function toggle(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (busy) return;
    setBusy(true);
    const previous = isSaved;
    setIsSaved(!previous);
    try {
      const response = await fetch("/api/account/favourites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const json = (await response.json()) as { saved?: boolean; error?: string };
      if (!response.ok) {
        throw new Error(json.error ?? "Could not update favourite.");
      }
      const next = Boolean(json.saved);
      setIsSaved(next);
      onSavedChange?.(next);
    } catch {
      setIsSaved(previous);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      aria-pressed={isSaved}
      aria-label={isSaved ? "Remove from favourites" : "Save to favourites"}
      className={cn(
        "size-10 rounded-full bg-card/95 shadow-sm hover:bg-card",
        isSaved && "text-copper",
        className,
      )}
      disabled={busy}
      onClick={(event) => void toggle(event)}
    >
      <Heart className={cn("size-4", isSaved && "fill-current")} />
    </Button>
  );
}
