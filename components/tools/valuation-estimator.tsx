"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BreakdownTable } from "@/components/tools/breakdown-table";
import { ToolField } from "@/components/tools/tool-field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMWK, formatNumber, formatPercent } from "@/lib/currency";
import { parseAmount } from "@/lib/parse-amount";
import {
  ANNUAL_DEPRECIATION,
  EXPECTED_KM_PER_YEAR,
  VALUATION_MAKES,
  estimateValuation,
  modelsForMake,
  valuationYears,
} from "@/lib/valuation";

const YEARS = valuationYears();

export function ValuationEstimator() {
  const [make, setMake] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [mileage, setMileage] = useState("");

  const models = make ? modelsForMake(make) : [];
  const mileageValue = parseAmount(mileage);
  const yearValue = year ? Number(year) : undefined;

  const result = useMemo(() => {
    if (!make || !model || yearValue == null || mileageValue == null) return null;
    if (mileageValue < 0 || !Number.isInteger(yearValue)) return null;
    return estimateValuation({
      make,
      model,
      year: yearValue,
      mileage: mileageValue,
    });
  }, [make, model, yearValue, mileageValue]);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Vehicle details</CardTitle>
          <CardDescription>
            Choose a common Malawi-market make and model. Mileage is in
            kilometres.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <ToolField label="Make">
            <Select
              value={make || undefined}
              onValueChange={(value) => {
                setMake(value);
                setModel("");
              }}
            >
              <SelectTrigger aria-label="Make">
                <SelectValue placeholder="Select make" />
              </SelectTrigger>
              <SelectContent>
                {VALUATION_MAKES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </ToolField>

          <ToolField label="Model">
            <Select
              value={model || undefined}
              onValueChange={setModel}
              disabled={!make}
            >
              <SelectTrigger aria-label="Model">
                <SelectValue
                  placeholder={make ? "Select model" : "Choose a make first"}
                />
              </SelectTrigger>
              <SelectContent>
                {models.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </ToolField>

          <ToolField label="Year">
            <Select value={year || undefined} onValueChange={setYear}>
              <SelectTrigger aria-label="Year">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((item) => (
                  <SelectItem key={item} value={String(item)}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </ToolField>

          <ToolField label="Mileage (km)" htmlFor="valuation-mileage">
            <Input
              id="valuation-mileage"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="86400"
              value={mileage}
              onChange={(event) => setMileage(event.target.value)}
            />
          </ToolField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estimated value</CardTitle>
          <CardDescription>
            {result
              ? `${result.year} ${result.make} ${result.model}`
              : "Fill in the details to see a price range."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {result ? (
            <>
              <div>
                <p className="text-sm text-muted-foreground">Today&apos;s range</p>
                <p className="mt-1 text-2xl font-extrabold leading-snug">
                  {formatMWK(result.low)} – {formatMWK(result.high)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Midpoint {formatMWK(result.midpoint)}
                </p>
              </div>
              <BreakdownTable
                caption="Valuation breakdown"
                rows={[
                  {
                    label: "Seed base price (as-new)",
                    value: formatMWK(result.basePrice),
                  },
                  {
                    label: `Age (${result.ageYears} yrs @ ${formatPercent(ANNUAL_DEPRECIATION, 0)} / yr)`,
                    value: `× ${result.ageFactor.toFixed(2)}`,
                  },
                  {
                    label: `Expected mileage (${formatNumber(EXPECTED_KM_PER_YEAR)} km/yr)`,
                    value: `${formatNumber(result.expectedMileage)} km`,
                  },
                  {
                    label: "Entered mileage",
                    value: `${formatNumber(result.mileage)} km`,
                  },
                  {
                    label: "Mileage adjustment",
                    value: `× ${result.mileageFactor.toFixed(2)}`,
                  },
                  {
                    label: "Estimated midpoint",
                    value: formatMWK(result.midpoint),
                    total: true,
                  },
                ]}
              />
              <p className="text-xs text-muted-foreground">
                Guide only — condition, service history, and local demand can
                move the price.{" "}
                <Link href="/sell" className="font-medium text-foreground underline-offset-4 hover:underline">
                  List this car
                </Link>
                .
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select make, model, and year, then enter mileage to get an
              estimated Malawi market range.
            </p>
          )}
          {result ? (
            <Button asChild className="w-full sm:w-auto">
              <Link href="/sell">Sell at this price</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
