import type { ReactNode } from "react";
import Link from "next/link";
import { Banknote, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ToolsSection() {
  return (
    <section id="tools" className="scroll-mt-28 py-16">
      <div className="mx-auto w-full max-w-site px-4 sm:px-6">
        <div className="mb-7">
          <h2 className="text-[clamp(1.15rem,0.95rem+1vw,1.35rem)] font-bold tracking-tight">
            Useful tools
          </h2>
          <p className="mt-1 text-[0.9rem] text-muted-foreground">
            Make a confident decision before you buy or sell.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-[18px] md:grid-cols-2">
          <ToolCard
            icon={<Banknote className="h-5 w-5 text-primary" />}
            title="Free car valuation"
            body="See what your car is worth in today's Malawi market in under a minute — no sign-up required."
            href="/tools/valuation"
            cta="Value my car"
          />
          <ToolCard
            icon={<Calculator className="h-5 w-5 text-primary" />}
            title="Import duty & finance calculator"
            body="Estimate import duty on Japan-import vehicles and your monthly instalments before you commit."
            href="/tools/import-calculator"
            cta="Calculate costs"
          />
        </div>
      </div>
    </section>
  );
}

function ToolCard({
  icon,
  title,
  body,
  href,
  cta,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <Card className="p-0">
      <CardHeader className="space-y-4 p-5 pb-0 sm:p-[26px] sm:pb-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-background">
          {icon}
        </div>
        <div className="space-y-1.5">
          <CardTitle className="text-[1.02rem]">{title}</CardTitle>
          <CardDescription className="text-[0.87rem]">{body}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-4 sm:p-[26px] sm:pt-4">
        <Button variant="outline" size="sm" className="h-11 md:h-[34px]" asChild>
          <Link href={href}>{cta}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
