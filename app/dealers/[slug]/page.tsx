import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ListingCard } from "@/components/listing-card";
import { getDealerBySlug, getListingsByDealer } from "@/lib/data";

export const dynamic = "force-dynamic";

type DealerPageProps = {
  params: { slug: string };
};

export async function generateMetadata({
  params,
}: DealerPageProps): Promise<Metadata> {
  const dealer = await getDealerBySlug(params.slug);
  if (!dealer) {
    return { title: "Dealer not found" };
  }

  return {
    title: dealer.name,
    description: `${dealer.name} in ${dealer.districts.join(", ")} — cars for sale on CarsMW.`,
  };
}

export default async function DealerProfilePage({ params }: DealerPageProps) {
  const dealer = await getDealerBySlug(params.slug);

  if (!dealer) {
    notFound();
  }

  const stock = await getListingsByDealer(dealer.slug);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-10">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {dealer.verified ? <Badge>Verified dealer</Badge> : null}
          {dealer.districts.map((district) => (
            <Badge key={district} variant="outline">
              {district}
            </Badge>
          ))}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{dealer.name}</h1>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Phone</dt>
            <dd>{dealer.phone}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">WhatsApp</dt>
            <dd>{dealer.whatsapp}</dd>
          </div>
        </dl>
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-semibold">Current stock</h2>
          <Link href="/listings" className="text-sm text-muted-foreground hover:text-foreground">
            All listings
          </Link>
        </div>
        {stock.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stock.map((listing) => (
              <ListingCard key={listing.id} listing={listing} dealer={dealer} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No live listings right now.</p>
        )}
      </section>
    </div>
  );
}
