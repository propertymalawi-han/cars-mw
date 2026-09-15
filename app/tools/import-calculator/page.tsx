import type { Metadata } from "next";
import Link from "next/link";
import { ImportCalculator } from "@/components/tools/import-calculator";

export const metadata: Metadata = {
  title: "Import duty & finance calculator",
  description:
    "Estimate Malawi import duty on a used vehicle and monthly loan instalments.",
};

export default function ImportCalculatorPage() {
  return (
    <div className="mx-auto w-full max-w-site space-y-8 px-6 py-10">
      <div className="max-w-3xl space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Import duty &amp; finance calculator
        </h1>
        <p className="text-muted-foreground">
          Estimate MRA used-vehicle duty from CIF, engine size, and age, then
          see a monthly instalment for a typical vehicle loan. Figures are a
          guide — MRA assesses the final bill at the border. Selling a car
          already here? Try the{" "}
          <Link
            href="/tools/valuation"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            free valuation
          </Link>
          .
        </p>
      </div>
      <ImportCalculator />
    </div>
  );
}
