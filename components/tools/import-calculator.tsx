"use client";

import { useMemo, useState } from "react";
import { BreakdownTable } from "@/components/tools/breakdown-table";
import { ToolField } from "@/components/tools/tool-field";
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
import { estimateMonthlyInstalment, LOAN_TERMS_MONTHS } from "@/lib/finance";
import { AGE_BANDS, estimateImportDuty } from "@/lib/import-duty";
import { parseAmount } from "@/lib/parse-amount";

const AGE_YEARS = Array.from({ length: 21 }, (_, index) => index);

export function ImportCalculator() {
  const [cif, setCif] = useState("");
  const [engineCc, setEngineCc] = useState("");
  const [ageYears, setAgeYears] = useState<string>("");
  const [loanAmount, setLoanAmount] = useState("");
  const [interestRate, setInterestRate] = useState("24");
  const [termMonths, setTermMonths] = useState("48");
  const [loanTouched, setLoanTouched] = useState(false);

  const cifValue = parseAmount(cif);
  const engineValue = parseAmount(engineCc);
  const ageValue = ageYears === "" ? undefined : Number(ageYears);

  const duty = useMemo(() => {
    if (cifValue == null || cifValue <= 0) return null;
    if (engineValue == null || engineValue <= 0) return null;
    if (ageValue == null || ageValue < 0) return null;
    return estimateImportDuty({
      cif: cifValue,
      engineCc: engineValue,
      ageYears: ageValue,
    });
  }, [cifValue, engineValue, ageValue]);

  const suggestedLoan = duty?.landedCost;
  const principal = parseAmount(loanTouched ? loanAmount : loanAmount || String(suggestedLoan ?? ""));
  const rateValue = parseAmount(interestRate);
  const termValue = Number(termMonths);

  const finance = useMemo(() => {
    if (principal == null || principal <= 0) return null;
    if (rateValue == null) return null;
    return estimateMonthlyInstalment({
      principal,
      annualRatePercent: rateValue,
      termMonths: termValue,
    });
  }, [principal, rateValue, termValue]);

  function handleLoanChange(value: string) {
    setLoanTouched(true);
    setLoanAmount(value);
  }

  const displayedLoan =
    loanTouched || loanAmount
      ? loanAmount
      : suggestedLoan
        ? String(suggestedLoan)
        : "";

  return (
    <div className="space-y-8">
      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Import details</CardTitle>
            <CardDescription>
              Enter CIF in MWK, engine size in cc, and the vehicle&apos;s age.
              Duty uses published MRA used-vehicle bands as a placeholder.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <ToolField label="CIF value (MWK)" htmlFor="import-cif">
              <Input
                id="import-cif"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="4500000"
                value={cif}
                onChange={(event) => setCif(event.target.value)}
              />
            </ToolField>
            <ToolField label="Engine size (cc)" htmlFor="import-engine">
              <Input
                id="import-engine"
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="1500"
                value={engineCc}
                onChange={(event) => setEngineCc(event.target.value)}
              />
            </ToolField>
            <ToolField label="Vehicle age">
              <Select
                value={ageYears || undefined}
                onValueChange={setAgeYears}
              >
                <SelectTrigger aria-label="Vehicle age">
                  <SelectValue placeholder="Select age" />
                </SelectTrigger>
                <SelectContent>
                  {AGE_YEARS.map((age) => (
                    <SelectItem key={age} value={String(age)}>
                      {age === 0
                        ? "Less than 1 year"
                        : `${age} ${age === 1 ? "year" : "years"}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ToolField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estimated duty</CardTitle>
            <CardDescription>
              {duty
                ? `${duty.engineBand.label} · ${duty.ageBand.label}`
                : "Fill in CIF, engine size, and age to estimate duty."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {duty ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Total duty payable</p>
                  <p className="mt-1 text-[1.65rem] font-extrabold leading-none">
                    {formatMWK(duty.totalDuty)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Landed estimate {formatMWK(duty.landedCost)} (CIF + duty)
                  </p>
                </div>
                <BreakdownTable
                  caption="Import duty breakdown"
                  rows={[
                    { label: "Customs value (CIF)", value: formatMWK(duty.cif) },
                    {
                      label: `Import duty (${formatPercent(duty.importDutyRate, 0)})`,
                      value: formatMWK(duty.importDuty),
                    },
                    {
                      label: `Excise (${formatPercent(duty.exciseRate, 0)})`,
                      value: formatMWK(duty.excise),
                    },
                    {
                      label: `VAT (${formatPercent(duty.vatRate, 1)})`,
                      value: formatMWK(duty.vat),
                    },
                    {
                      label: "Total duty",
                      value: formatMWK(duty.totalDuty),
                      total: true,
                    },
                    {
                      label: "Estimated landed cost",
                      value: formatMWK(duty.landedCost),
                    },
                  ]}
                />
                <p className="text-xs text-muted-foreground">
                  Placeholder MRA schedule: {formatPercent(0.25, 0)} duty,{" "}
                  {formatPercent(0.165, 1)} VAT, excise by engine and age
                  ({AGE_BANDS.map((band) => band.label).join("; ")}). Final
                  assessment is by MRA at clearance.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Enter a CIF value, engine size, and vehicle age to see import
                duty, excise, and VAT.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Loan details</CardTitle>
            <CardDescription>
              Estimate a monthly instalment. Defaults use a typical Malawi
              vehicle-loan rate; your bank&apos;s offer will differ.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <ToolField label="Loan amount (MWK)" htmlFor="loan-amount">
              <Input
                id="loan-amount"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder={suggestedLoan ? String(suggestedLoan) : "8000000"}
                value={displayedLoan}
                onChange={(event) => handleLoanChange(event.target.value)}
              />
            </ToolField>
            <ToolField label="Interest rate (% per year)" htmlFor="loan-rate">
              <Input
                id="loan-rate"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.1"
                placeholder="24"
                value={interestRate}
                onChange={(event) => setInterestRate(event.target.value)}
              />
            </ToolField>
            <ToolField label="Term">
              <Select value={termMonths} onValueChange={setTermMonths}>
                <SelectTrigger aria-label="Loan term">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {LOAN_TERMS_MONTHS.map((months) => (
                    <SelectItem key={months} value={String(months)}>
                      {months} months ({months / 12} {months === 12 ? "year" : "years"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ToolField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly instalment</CardTitle>
            <CardDescription>
              {finance
                ? `Reducing-balance loan over ${finance.termMonths} months`
                : "Enter a loan amount, rate, and term."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {finance ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Monthly payment</p>
                  <p className="mt-1 text-[1.65rem] font-extrabold leading-none">
                    {formatMWK(finance.monthlyPayment)}
                  </p>
                </div>
                <BreakdownTable
                  caption="Finance breakdown"
                  rows={[
                    {
                      label: "Loan amount",
                      value: formatMWK(finance.principal),
                    },
                    {
                      label: "Interest rate",
                      value: `${finance.annualRatePercent.toLocaleString("en-MW", { maximumFractionDigits: 2 })}% p.a.`,
                    },
                    {
                      label: "Term",
                      value: `${formatNumber(finance.termMonths)} months`,
                    },
                    {
                      label: "Total interest",
                      value: formatMWK(finance.totalInterest),
                    },
                    {
                      label: "Total repayable",
                      value: formatMWK(finance.totalRepayable),
                      total: true,
                    },
                    {
                      label: "Monthly instalment",
                      value: formatMWK(finance.monthlyPayment),
                    },
                  ]}
                />
                <p className="text-xs text-muted-foreground">
                  Does not include arrangement fees, insurance, or a deposit.
                  Confirm the schedule with your lender.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Enter the amount you plan to borrow to see estimated monthly
                instalments. If you have already calculated duty, the loan
                amount defaults to CIF plus duty.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
