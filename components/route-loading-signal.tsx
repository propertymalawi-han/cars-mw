"use client";

import { useLayoutEffect } from "react";
import { beginRouteSuspense, endRouteSuspense } from "@/lib/route-loading";

/** Mount inside loading.tsx so the route bar stays up until Suspense resolves. */
export function RouteLoadingSignal() {
  useLayoutEffect(() => {
    beginRouteSuspense();
    return () => endRouteSuspense();
  }, []);

  return <span data-route-loading-signal="" hidden />;
}
