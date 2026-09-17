"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Account page failed", error);
  }, [error]);

  return (
    <div className="space-y-3">
      <h1 className="text-[clamp(1.5rem,1.1rem+2vw,1.875rem)] font-semibold tracking-tight">
        Couldn’t load your account
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
