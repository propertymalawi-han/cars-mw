import type { Metadata } from "next";
import Link from "next/link";
import { ValuationEstimator } from "@/components/tools/valuation-estimator";

export const metadata: Metadata = {
  title: "Car valuation",
  description:
    "Estimate what your car is worth in Malawi from make, model, year, and mileage.",
};

export default function ValuationPage() {
  return (
    <div className="mx-auto w-full max-w-site space-y-8 px-4 py-8 sm:px-6 sm:py-10">
      <div className="max-w-3xl space-y-2">
        <h1 className="text-[clamp(1.5rem,1.1rem+2vw,1.875rem)] font-semibold tracking-tight">
          Free car valuation
        </h1>
        <p className="text-muted-foreground">
          See a Malawi market price range in under a minute. We start from a
          seed as-new table, then apply a basic depreciation formula for age
          and kilometres. Importing instead? Use the{" "}
          <Link
            href="/tools/import-calculator"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            duty &amp; finance calculator
          </Link>
          .
        </p>
      </div>
      <ValuationEstimator />
    </div>
  );
}
