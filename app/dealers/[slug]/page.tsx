import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ListingCard } from "@/components/listing-card";
import { getDealerBySlug, getListingsForSeller } from "@/lib/data";

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
    description:
      dealer.description ||
      `${dealer.name} in ${dealer.districts.join(", ")} — cars for sale on CarsMW.`,
  };
}

export default async function DealerProfilePage({ params }: DealerPageProps) {
  const dealer = await getDealerBySlug(params.slug);

  if (!dealer) {
    notFound();
  }

  const stock = await getListingsForSeller(dealer.userId);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-8 sm:py-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        {dealer.logoUrl ? (
          <div className="relative size-20 overflow-hidden rounded-lg border bg-card">
            <Image
              src={dealer.logoUrl}
              alt={`${dealer.name} logo`}
              fill
              className="object-cover"
              sizes="80px"
              priority
            />
          </div>
        ) : (
          <div className="flex size-20 items-center justify-center rounded-lg border bg-card text-2xl font-semibold">
            {dealer.name.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {dealer.verified ? <Badge variant="success">Verified dealer</Badge> : null}
            {dealer.districts.map((district) => (
              <Badge key={district} variant="outline">
                {district}
              </Badge>
            ))}
          </div>
          <h1 className="text-[clamp(1.5rem,1.1rem+2vw,1.875rem)] font-semibold tracking-tight">
            {dealer.name}
          </h1>
          {dealer.description ? (
            <p className="max-w-3xl text-muted-foreground">{dealer.description}</p>
          ) : null}
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
      </div>

      <section className="space-y-4">
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-[clamp(1.15rem,0.95rem+1vw,1.25rem)] font-semibold">Current stock</h2>
          <Link href="/listings" className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground">
            All listings
          </Link>
        </div>
        {stock.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 nav:grid-cols-3">
            {stock.map((listing, index) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                dealer={dealer}
                priority={index < 3}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No live listings right now.</p>
        )}
      </section>
    </div>
  );
}
