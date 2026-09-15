import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const STEPS = [
  {
    n: "1",
    title: "Search & compare",
    body: "Filter by make, body type, budget and district.",
  },
  {
    n: "2",
    title: "Talk to the seller",
    body: "Message dealers and private sellers directly.",
  },
  {
    n: "3",
    title: "Buy with confidence",
    body: "Use our valuation and cost tools before you decide.",
  },
] as const;

export function AboutSection() {
  return (
    <section id="about" className="scroll-mt-28 py-16">
      <div className="mx-auto w-full max-w-site px-4 sm:px-6">
        <div className="grid w-full grid-cols-1 items-center gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-[50px]">
          <div className="min-w-0">
            <h2 className="mb-3.5 text-[clamp(1.35rem,1rem+1.6vw,1.5rem)] font-bold tracking-tight">
              About CarsMW
            </h2>
            <p className="mb-3 text-[0.92rem] text-muted-foreground">
              CarsMW is Malawi&apos;s marketplace for buying and selling new and
              used vehicles. From Lilongwe to Mzuzu, we bring dealers and
              private sellers together with buyers across every district.
            </p>
            <p className="mb-5 text-[0.92rem] text-muted-foreground">
              We built CarsMW to make finding a reliable car simple: clear
              pricing in Kwacha, verified dealers, and tools that help you
              understand real running and import costs before you buy.
            </p>
            <Button asChild className="h-11 w-full sm:w-auto">
              <Link href="/listings">More about CarsMW</Link>
            </Button>
          </div>
          <Card className="w-full p-5 sm:p-8">
            <div className="grid gap-5">
              {STEPS.map((step) => (
                <div key={step.n} className="flex gap-3.5">
                  <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border text-[0.78rem] font-bold text-muted-foreground">
                    {step.n}
                  </div>
                  <div>
                    <strong className="text-[0.92rem] font-semibold">
                      {step.title}
                    </strong>
                    <div className="mt-0.5 text-[0.84rem] text-muted-foreground">
                      {step.body}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
