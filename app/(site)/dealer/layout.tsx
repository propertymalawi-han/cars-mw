import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DealerMobileNav, DealerSidebar } from "@/components/dealer/dealer-nav";
import { requireDealerPage } from "@/lib/dealer";

export const metadata: Metadata = {
  title: "Dealer dashboard",
};

export default async function DealerLayout({ children }: { children: ReactNode }) {
  const { dealer } = await requireDealerPage("/dealer/dashboard");

  if (!dealer) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-[clamp(1.5rem,1.1rem+2vw,1.875rem)] font-semibold tracking-tight">
          Dealer dashboard
        </h1>
        <p className="text-muted-foreground">
          Your account is marked as a dealer, but the dealership profile is missing.
        </p>
        <Button asChild>
          <Link href="/account">Back to account</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="border-b bg-muted/40">
      <div className="mx-auto w-full max-w-site px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-6 nav:flex-row nav:items-start nav:gap-8">
          <DealerSidebar
            dealerName={dealer.name}
            verified={dealer.verified}
            logoUrl={dealer.logoUrl}
          />
          <div className="min-w-0 flex-1 space-y-6">
            <DealerMobileNav dealerName={dealer.name} verified={dealer.verified} />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
