import type { ListingStatus } from "@prisma/client";

export function soldAtForStatusChange({
  nextStatus,
  previousStatus,
  existingSoldAt,
  at = new Date(),
}: {
  nextStatus: ListingStatus;
  previousStatus: ListingStatus;
  existingSoldAt: Date | null;
  at?: Date;
}): Date | null | undefined {
  if (nextStatus === "sold") {
    return existingSoldAt ?? at;
  }

  if (nextStatus === "muted") {
    return undefined;
  }

  if (previousStatus === "sold" || existingSoldAt) {
    return null;
  }

  return undefined;
}

export function listingSoldWrite(
  previousStatus: ListingStatus,
  existingSoldAt: Date | null,
  at = new Date(),
) {
  return {
    status: "sold" as const,
    soldAt: existingSoldAt ?? at,
  };
}
