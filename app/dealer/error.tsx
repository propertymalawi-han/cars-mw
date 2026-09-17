"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DealerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dealer page failed", error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-site space-y-3 px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-[clamp(1.5rem,1.1rem+2vw,1.875rem)] font-semibold tracking-tight">
        Couldn’t load the dealer dashboard
      </h1>
      <p className="text-muted-foreground">
        Sign-in worked, but this page could not reach the database. Try again in
        a moment.
      </p>
      <Button variant="copper" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
