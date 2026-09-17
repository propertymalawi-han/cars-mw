"use client";

import { useEffect, useRef, useState } from "react";
import {
  installRouteLoadingListeners,
  subscribeRouteLoading,
} from "@/lib/route-loading";

function StickCar() {
  return (
    <svg
      viewBox="0 0 32 16"
      fill="none"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-full w-full"
      aria-hidden
    >
      <path d="M8.2 5.4 10.4 2.4h8.4l2.3 3" className="stroke-primary" />
      <rect x="3.2" y="5.2" width="22.4" height="6.6" rx="1.5" className="stroke-primary" />
      <path d="M14.6 2.4v3" className="stroke-copper" />
      <path d="M6.2 8.4h4.2" className="stroke-copper" />
      <circle cx="9.2" cy="12.6" r="2.05" className="stroke-copper" />
      <circle cx="21.4" cy="12.6" r="2.05" className="stroke-copper" />
    </svg>
  );
}

export function RouteLoadingBar() {
  const barRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [top, setTop] = useState(64);

  useEffect(() => subscribeRouteLoading(setVisible), []);

  useEffect(() => installRouteLoadingListeners(), []);

  useEffect(() => {
    const header = document.querySelector<HTMLElement>("[data-site-header]");
    const bar = barRef.current;

    const update = () => {
      if (header) setTop(Math.round(header.getBoundingClientRect().bottom));
      if (bar) {
        bar.style.setProperty("--route-road-width", `${bar.clientWidth}px`);
      }
    };

    update();
    const observer = new ResizeObserver(update);
    if (header) observer.observe(header);
    if (bar) observer.observe(bar);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [visible]);

  return (
    <div
      ref={barRef}
      className="route-loading-bar pointer-events-none fixed inset-x-0 z-[45] h-6 overflow-visible transition-opacity duration-fade ease-out"
      style={{ top, opacity: visible ? 1 : 0 }}
      aria-hidden={!visible}
      data-visible={visible ? "true" : "false"}
    >
      {visible ? (
        <span className="sr-only" role="status">
          Loading page
        </span>
      ) : null}
      <div className="route-loading-car">
        <div className="route-loading-car-body">
          <StickCar />
        </div>
      </div>
      <div className="route-loading-road">
        <span className="route-loading-pothole" />
        <span className="route-loading-pothole" />
        <span className="route-loading-pothole" />
      </div>
    </div>
  );
}
