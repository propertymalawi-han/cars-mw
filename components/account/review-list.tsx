"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { EmptyState } from "@/components/account/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/format-date";
import { cn } from "@/lib/utils";

export type ReviewItem = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  dealer: { id: string; name: string; slug: string };
};

export type ReviewableDealer = {
  id: string;
  name: string;
  slug: string;
};

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((score) => (
        <button
          key={score}
          type="button"
          role="radio"
          aria-checked={value === score}
          aria-label={`${score} star${score === 1 ? "" : "s"}`}
          className="rounded-md p-1 text-muted-foreground hover:text-copper"
          onClick={() => onChange(score)}
        >
          <Star className={cn("size-5", score <= value && "fill-copper text-copper")} />
        </button>
      ))}
    </div>
  );
}

function ReviewEditor({
  dealerId,
  dealerName,
  initialRating = 0,
  initialComment = "",
  reviewId,
  onDone,
}: {
  dealerId: string;
  dealerName: string;
  initialRating?: number;
  initialComment?: string;
  reviewId?: string;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(
        reviewId ? `/api/account/reviews/${reviewId}` : "/api/account/reviews",
        {
          method: reviewId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dealerId, rating, comment }),
        },
      );
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(json.error ?? "Could not save that review.");
      }
      onDone();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not save that review.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{dealerName}</p>
      <StarPicker value={rating} onChange={setRating} />
      <Textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Share what stood out about this dealer…"
        rows={4}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button
        type="button"
        variant="copper"
        disabled={pending || rating < 1}
        onClick={() => void submit()}
      >
        {pending ? "Saving…" : reviewId ? "Save changes" : "Publish review"}
      </Button>
    </div>
  );
}

export function ReviewList({
  reviews,
  reviewable,
}: {
  reviews: ReviewItem[];
  reviewable: ReviewableDealer[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [writingFor, setWritingFor] = useState<string | null>(reviewable[0]?.id ?? null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function remove(id: string) {
    setPending(true);
    try {
      const response = await fetch(`/api/account/reviews/${id}`, { method: "DELETE" });
      if (response.ok) {
        setConfirmId(null);
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  const writingDealer = reviewable.find((dealer) => dealer.id === writingFor);

  return (
    <div className="space-y-6">
      {reviewable.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Leave a review</CardTitle>
            <CardDescription>
              You completed an enquiry with{" "}
              {reviewable.length === 1
                ? reviewable[0]!.name
                : `${reviewable.length} dealers`}
              . How did they do?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviewable.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                {reviewable.map((dealer) => (
                  <Button
                    key={dealer.id}
                    type="button"
                    size="sm"
                    variant={writingFor === dealer.id ? "copper" : "outline"}
                    onClick={() => setWritingFor(dealer.id)}
                  >
                    {dealer.name}
                  </Button>
                ))}
              </div>
            ) : null}
            {writingDealer ? (
              <ReviewEditor
                key={writingDealer.id}
                dealerId={writingDealer.id}
                dealerName={writingDealer.name}
                onDone={() => router.refresh()}
              />
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {reviews.length === 0 && reviewable.length === 0 ? (
        <EmptyState
          title="No reviews yet"
          description="After you close an enquiry with a dealer, you can rate them here."
          action={{ href: "/account/enquiries", label: "View enquiries" }}
        />
      ) : null}

      <div className="space-y-3">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardHeader className="space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{review.dealer.name}</CardTitle>
                  <CardDescription>{formatDate(review.createdAt)}</CardDescription>
                </div>
                <Badge variant="copper">{review.rating} / 5</Badge>
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((score) => (
                  <Star
                    key={score}
                    className={cn(
                      "size-4 text-muted-foreground",
                      score <= review.rating && "fill-copper text-copper",
                    )}
                  />
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {review.comment ? (
                <p className="text-sm leading-relaxed">{review.comment}</p>
              ) : (
                <p className="text-sm text-muted-foreground">No written comment.</p>
              )}
              {editingId === review.id ? (
                <ReviewEditor
                  reviewId={review.id}
                  dealerId={review.dealer.id}
                  dealerName={review.dealer.name}
                  initialRating={review.rating}
                  initialComment={review.comment}
                  onDone={() => {
                    setEditingId(null);
                    router.refresh();
                  }}
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(review.id)}
                  >
                    Edit
                  </Button>
                  {confirmId === review.id ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={pending}
                      onClick={() => void remove(review.id)}
                    >
                      Confirm delete
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmId(review.id)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
