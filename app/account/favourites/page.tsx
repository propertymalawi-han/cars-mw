import type { Metadata } from "next";
import { FavouritesGrid } from "@/components/account/favourites-grid";
import { getFavouriteListings } from "@/lib/account";
import { requirePageUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Favourites",
};

export const dynamic = "force-dynamic";

export default async function FavouritesPage() {
  const user = await requirePageUser("/account/favourites");
  const items = await getFavouriteListings(user.id);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-[clamp(1.5rem,1.1rem+2vw,1.875rem)] font-semibold tracking-tight">
          Favourites
        </h1>
        <p className="text-muted-foreground">
          Cars you have saved. Tap the heart again to remove one.
        </p>
      </div>
      <FavouritesGrid items={items} />
    </div>
  );
}
