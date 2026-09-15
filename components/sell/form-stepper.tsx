"use client";

import { Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { SELL_STEPS, type SellStepId } from "@/lib/validations/listing";

export function FormStepper({
  current,
  highest,
  onStepSelect,
}: {
  current: SellStepId;
  highest: SellStepId;
  onStepSelect: (step: SellStepId) => void;
}) {
  const currentIndex = SELL_STEPS.findIndex((step) => step.id === current);
  const highestIndex = SELL_STEPS.findIndex((step) => step.id === highest);
  const progress = ((currentIndex + 1) / SELL_STEPS.length) * 100;

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start justify-between gap-1 sm:flex-row sm:items-end sm:gap-4">
        <p className="text-sm font-medium">
          Step {currentIndex + 1} of {SELL_STEPS.length}
          <span className="ml-1.5 font-normal text-muted-foreground">
            {SELL_STEPS[currentIndex]?.description}
          </span>
        </p>
        <p className="text-xs font-medium text-muted-foreground">
          {Math.round(progress)}% complete
        </p>
      </div>
      <Progress value={progress} aria-hidden />
      <TabsList className="flex h-auto w-full items-start justify-between gap-1 overflow-x-auto bg-transparent p-0">
        {SELL_STEPS.map((step, index) => {
          const isCurrent = step.id === current;
          const isComplete = index < currentIndex;
          const isReachable = index <= highestIndex;

          return (
            <TabsTrigger
              key={step.id}
              value={step.id}
              disabled={!isReachable}
              onClick={() => {
                if (isReachable) onStepSelect(step.id);
              }}
              className={cn(
                "relative flex min-h-11 min-w-0 flex-1 flex-col items-center gap-2 rounded-none bg-transparent p-0 shadow-none",
                "data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                "disabled:opacity-40",
              )}
            >
              <span className="flex w-full items-center">
                <span
                  className={cn(
                    "h-px flex-1",
                    index === 0 ? "bg-transparent" : isComplete || isCurrent ? "bg-copper" : "bg-border",
                  )}
                />
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-xs font-semibold sm:h-8 sm:w-8",
                    isCurrent && "border-copper bg-copper text-copper-foreground",
                    isComplete && "border-primary bg-primary text-primary-foreground",
                    !isCurrent && !isComplete && "border-border bg-card text-muted-foreground",
                  )}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span
                  className={cn(
                    "h-px flex-1",
                    index === SELL_STEPS.length - 1
                      ? "bg-transparent"
                      : index < currentIndex
                        ? "bg-copper"
                        : "bg-border",
                  )}
                />
              </span>
              <span
                className={cn(
                  "hidden text-[0.72rem] font-semibold sm:block",
                  isCurrent ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </div>
  );
}
