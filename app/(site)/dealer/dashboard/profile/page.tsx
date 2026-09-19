import type { Metadata } from "next";
import { DealerProfileForm } from "@/components/dealer/profile-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireDealerPage } from "@/lib/dealer";
import type { MalawiDistrict } from "@/types";

export const metadata: Metadata = {
  title: "Dealership profile",
};

export const dynamic = "force-dynamic";

export default async function DealerProfilePage() {
  const { dealer } = await requireDealerPage("/dealer/dashboard/profile");
  if (!dealer) return null;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-[clamp(1.5rem,1.1rem+2vw,1.875rem)] font-semibold tracking-tight">
          Dealership profile
        </h1>
        <p className="text-muted-foreground">
          This information appears on your public page at{" "}
          <span className="font-medium text-foreground">/dealers/{dealer.slug}</span>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Public details</CardTitle>
          <CardDescription>
            Name, logo, districts, and contact details shown to buyers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DealerProfileForm
            publicHref={`/dealers/${dealer.slug}`}
            defaultValues={{
              name: dealer.name,
              phone: dealer.phone,
              whatsapp: dealer.whatsapp,
              description: dealer.description,
              logoUrl: dealer.logoUrl,
              districts: dealer.districts as MalawiDistrict[],
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
