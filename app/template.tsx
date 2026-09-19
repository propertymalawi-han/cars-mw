"use client";

import { useEffect } from "react";
import { notifyRouteTemplateReady } from "@/lib/route-loading";

export default function Template({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    notifyRouteTemplateReady();
  }, []);

  return children;
}
