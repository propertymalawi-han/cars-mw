"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { pageTransition } from "@/lib/motion";
import { notifyRouteTemplateReady } from "@/lib/route-loading";

declare global {
  interface Window {
    __carsMwHasPage?: boolean;
  }
}

export default function Template({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  const animateEnter =
    typeof window !== "undefined" && Boolean(window.__carsMwHasPage) && !reduceMotion;
  const [settled, setSettled] = useState(!animateEnter);

  useEffect(() => {
    window.__carsMwHasPage = true;
    notifyRouteTemplateReady();
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={animateEnter ? pageTransition.initial : false}
        animate={pageTransition.animate}
        exit={animateEnter ? pageTransition.exit : undefined}
        transition={pageTransition.transition}
        onAnimationComplete={() => setSettled(true)}
        style={settled ? { transform: "none" } : undefined}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
