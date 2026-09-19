import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin";
import { logAdminAction } from "@/lib/adminAudit";
import { jsonError } from "@/lib/api-session";
import {
  DEFAULT_FEATURE_DAYS,
  featuredUntilFromDays,
} from "@/lib/listing-featured";
import { revalidateListingsCache } from "@/lib/listings-cache";
import { prisma } from "@/lib/prisma";
import { adminListingActionSchema } from "@/lib/validations/admin";
import type { ListingStatus } from "@prisma/client";

export const runtime = "nodejs";

type RouteContext = { params: { id: string } };

function restorableStatus(status: ListingStatus | null): ListingStatus {
  if (status && status !== "muted") return status;
  return "active";
}

function afterListingChange() {
  revalidateListingsCache();
  revalidatePath("/admin/listings");
  revalidatePath("/admin/users");
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { user, response } = await requireAdminUser();
  if (!user) return response;

  const parsed = adminListingActionSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Could not update that listing.");

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
  });
  if (!listing || listing.deletedAt) return jsonError("Listing not found.", 404);

  const action = parsed.data.action;

  if (action === "mute") {
    const previousStatus =
      listing.status === "muted"
        ? restorableStatus(listing.mutedPreviousStatus)
        : listing.status;

    const updated = await prisma.listing.update({
      where: { id: listing.id },
      data: {
        status: "muted",
        mutedReason: parsed.data.reason,
        mutedPreviousStatus: previousStatus,
      },
    });

    await logAdminAction({
      adminUserId: user.id,
      action: "listing.mute",
      targetType: "listing",
      targetId: listing.id,
      metadata: {
        reason: parsed.data.reason,
        previousStatus,
        title: listing.title,
      },
    });

    afterListingChange();
    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      mutedReason: updated.mutedReason,
    });
  }

  if (action === "unmute") {
    if (listing.status !== "muted") {
      return jsonError("This listing is not muted.");
    }

    const restoredStatus = restorableStatus(listing.mutedPreviousStatus);
    const updated = await prisma.listing.update({
      where: { id: listing.id },
      data: {
        status: restoredStatus,
        mutedReason: null,
        mutedPreviousStatus: null,
      },
    });

    await logAdminAction({
      adminUserId: user.id,
      action: "listing.unmute",
      targetType: "listing",
      targetId: listing.id,
      metadata: {
        restoredStatus,
        previousReason: listing.mutedReason,
        title: listing.title,
      },
    });

    afterListingChange();
    return NextResponse.json({ id: updated.id, status: updated.status });
  }

  if (action === "delete") {
    const updated = await prisma.listing.update({
      where: { id: listing.id },
      data: { deletedAt: new Date() },
    });

    await logAdminAction({
      adminUserId: user.id,
      action: "listing.delete",
      targetType: "listing",
      targetId: listing.id,
      metadata: {
        previousStatus: listing.status,
        title: listing.title,
      },
    });

    afterListingChange();
    return NextResponse.json({ id: updated.id, deletedAt: updated.deletedAt });
  }

  if (action === "feature") {
    const days = parsed.data.days ?? DEFAULT_FEATURE_DAYS;
    const featuredUntil = featuredUntilFromDays(days);
    const updated = await prisma.listing.update({
      where: { id: listing.id },
      data: { featuredUntil },
    });

    await logAdminAction({
      adminUserId: user.id,
      action: "listing.feature",
      targetType: "listing",
      targetId: listing.id,
      metadata: {
        days,
        featuredUntil: featuredUntil.toISOString(),
        title: listing.title,
      },
    });

    afterListingChange();
    return NextResponse.json({
      id: updated.id,
      featuredUntil: updated.featuredUntil,
    });
  }

  const updated = await prisma.listing.update({
    where: { id: listing.id },
    data: { featuredUntil: null },
  });

  await logAdminAction({
    adminUserId: user.id,
    action: "listing.unfeature",
    targetType: "listing",
    targetId: listing.id,
    metadata: {
      previousFeaturedUntil: listing.featuredUntil?.toISOString() ?? null,
      title: listing.title,
    },
  });

  afterListingChange();
  return NextResponse.json({
    id: updated.id,
    featuredUntil: updated.featuredUntil,
  });
}
