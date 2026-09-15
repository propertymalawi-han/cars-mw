import type { Metadata } from "next";
import { SellForm } from "@/components/sell/sell-form";

export const metadata: Metadata = {
  title: "Sell your car",
  description: "Create a listing and sell your car in Malawi for MWK.",
};

export default function SellPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="space-y-2">
        <h1 className="text-[clamp(1.5rem,1.1rem+2vw,1.875rem)] font-semibold tracking-tight">
          Sell your car
        </h1>
        <p className="text-muted-foreground">
          List in a few steps: vehicle details, photos, price, and your contact
          information. Prices are in Malawian Kwacha.
        </p>
      </div>
      <SellForm />
    </div>
  );
}
