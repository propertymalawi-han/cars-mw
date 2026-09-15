import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SellPanel() {
  return (
    <section id="sell" className="scroll-mt-28 pb-16 pt-2.5">
      <div className="mx-auto w-full max-w-site px-4 sm:px-6">
        <div className="flex flex-col items-stretch gap-6 rounded-[14px] bg-primary px-5 py-8 text-primary-foreground sm:flex-row sm:items-center sm:justify-between sm:px-11 sm:py-10">
          <div className="min-w-0">
            <h3 className="max-w-[26ch] text-[clamp(1.15rem,0.9rem+1.2vw,1.3rem)] font-bold tracking-tight">
              Selling your car? Reach buyers all over Malawi.
            </h3>
            <p className="mt-2 max-w-[40ch] text-[0.9rem] text-primary-foreground/60">
              List in minutes, get a fair market valuation first, and manage
              enquiries from one place.
            </p>
          </div>
          <Button variant="copper" size="lg" className="h-11 w-full shrink-0 sm:w-auto" asChild>
            <Link href="/sell">List your car — it&apos;s free</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
