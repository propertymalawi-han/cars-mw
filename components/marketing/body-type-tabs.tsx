"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HomeFeaturedTabId } from "@/lib/home-featured";

const TABS = [
  { id: "all", label: "All vehicles", icon: <SedanIcon /> },
  { id: "sedan", label: "Sedan", icon: <SedanIcon /> },
  { id: "suv", label: "SUV & 4x4", icon: <SuvIcon /> },
  { id: "pickup", label: "Pickup / Bakkie", icon: <PickupIcon /> },
  { id: "hatchback", label: "Hatchback", icon: <HatchIcon /> },
  { id: "van", label: "Minibus", icon: <VanIcon /> },
] as const satisfies ReadonlyArray<{
  id: HomeFeaturedTabId;
  label: string;
  icon: ReactNode;
}>;

export function BodyTypeTabs({
  active = "all",
  onChange,
}: {
  active?: string;
  onChange: (id: HomeFeaturedTabId) => void;
}) {
  const current = TABS.some((tab) => tab.id === active) ? active : "all";

  return (
    <section className="pb-5 pt-10 sm:pt-16">
      <div className="mx-auto w-full max-w-site px-4 sm:px-6">
        <div className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1">
          {TABS.map((tab) => {
            const isActive = tab.id === current;
            return (
              <Button
                key={tab.id}
                type="button"
                variant={isActive ? "default" : "outline"}
                className={cn(
                  "h-11 shrink-0 snap-start rounded-full px-4 text-[0.84rem] font-medium shadow-none",
                  !isActive && "text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={isActive}
                onClick={() => onChange(tab.id)}
              >
                {tab.icon}
                {tab.label}
              </Button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-4 w-4"
      aria-hidden
    >
      {children}
    </svg>
  );
}

function SedanIcon() {
  return (
    <Icon>
      <path d="M3 15l1.6-5A2 2 0 0 1 6.5 8.5h11a2 2 0 0 1 1.9 1.5L21 15" />
      <rect x="2.5" y="15" width="19" height="4.2" rx="1.4" />
      <circle cx="7" cy="19.4" r="1.4" />
      <circle cx="17" cy="19.4" r="1.4" />
    </Icon>
  );
}

function SuvIcon() {
  return (
    <Icon>
      <path d="M2.5 15.5l2-6.4A2 2 0 0 1 6.4 7.6h11.2a2 2 0 0 1 1.9 1.5l2 6.4" />
      <rect x="2" y="15.5" width="20" height="4.3" rx="1.4" />
      <circle cx="7" cy="19.9" r="1.4" />
      <circle cx="17" cy="19.9" r="1.4" />
    </Icon>
  );
}

function PickupIcon() {
  return (
    <Icon>
      <path d="M2 16l1.4-5.2A2 2 0 0 1 5.3 9.3h5.6v6.7" />
      <path d="M11 9.3h6.2a2 2 0 0 1 1.9 1.4l1.4 5.3" />
      <rect x="2" y="16" width="20" height="3.8" rx="1.3" />
      <circle cx="7" cy="20.1" r="1.3" />
      <circle cx="17" cy="20.1" r="1.3" />
    </Icon>
  );
}

function HatchIcon() {
  return (
    <Icon>
      <path d="M4 15l1.3-4.6A1.8 1.8 0 0 1 7 9h10a1.8 1.8 0 0 1 1.7 1.4L20 15" />
      <rect x="3.3" y="15" width="17.4" height="4" rx="1.3" />
      <circle cx="8" cy="19.2" r="1.3" />
      <circle cx="16" cy="19.2" r="1.3" />
    </Icon>
  );
}

function VanIcon() {
  return (
    <Icon>
      <path d="M3 16V9.6A1.6 1.6 0 0 1 4.6 8h14.8A1.6 1.6 0 0 1 21 9.6V16" />
      <rect x="2.5" y="16" width="19" height="3.6" rx="1.2" />
      <line x1="9" y1="8" x2="9" y2="16" />
      <line x1="15" y1="8" x2="15" y2="16" />
      <circle cx="7" cy="19.6" r="1.2" />
      <circle cx="17" cy="19.6" r="1.2" />
    </Icon>
  );
}
