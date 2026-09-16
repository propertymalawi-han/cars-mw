import type { Metadata } from "next";
import { ReviewList } from "@/components/account/review-list";
import { getReviewableDealers, getUserReviews } from "@/lib/account";
import { requirePageUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Ratings & reviews",
};

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const user = await requirePageUser("/account/reviews");
  const [reviews, reviewable] = await Promise.all([
    getUserReviews(user.id),
    getReviewableDealers(user.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-[clamp(1.5rem,1.1rem+2vw,1.875rem)] font-semibold tracking-tight">
          Ratings & reviews
        </h1>
        <p className="text-muted-foreground">
          Reviews you have left for dealers after completing an enquiry.
        </p>
      </div>
      <ReviewList
        reviews={reviews.map((review) => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt.toISOString(),
          dealer: {
            id: review.dealer.id,
            name: review.dealer.name,
            slug: review.dealer.slug,
          },
        }))}
        reviewable={reviewable.map((dealer) => ({
          id: dealer.id,
          name: dealer.name,
          slug: dealer.slug,
        }))}
      />
    </div>
  );
}
