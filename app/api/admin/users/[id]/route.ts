import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin";
import { logAdminAction } from "@/lib/adminAudit";
import { jsonError } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { getEmailRedirectTo } from "@/lib/return-to";
import { createSupabaseAuthClient } from "@/lib/supabase/server";
import { revokeUserSessions } from "@/lib/user-status";
import { adminUserActionSchema } from "@/lib/validations/admin";

export const runtime = "nodejs";

type RouteContext = { params: { id: string } };

function afterUserChange(userId: string) {
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin");
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { user: admin, response } = await requireAdminUser();
  if (!admin) return response;

  const parsed = adminUserActionSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Could not update that user.");

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    include: { dealer: true },
  });
  if (!target) return jsonError("User not found.", 404);

  const action = parsed.data.action;

  if (action === "suspend") {
    if (target.id === admin.id) {
      return jsonError("You cannot suspend your own account.");
    }
    if (target.suspended) {
      return jsonError("This account is already suspended.");
    }

    const updated = await prisma.user.update({
      where: { id: target.id },
      data: {
        suspended: true,
        suspendedReason: parsed.data.reason,
        suspendedAt: new Date(),
      },
    });
    await revokeUserSessions(target.id);

    await logAdminAction({
      adminUserId: admin.id,
      action: "user.suspend",
      targetType: "user",
      targetId: target.id,
      metadata: {
        reason: parsed.data.reason,
        email: target.email,
        name: target.name,
      },
    });

    afterUserChange(target.id);
    return NextResponse.json({
      id: updated.id,
      suspended: updated.suspended,
      suspendedReason: updated.suspendedReason,
    });
  }

  if (action === "reactivate") {
    if (!target.suspended) {
      return jsonError("This account is not suspended.");
    }

    const updated = await prisma.user.update({
      where: { id: target.id },
      data: {
        suspended: false,
        suspendedReason: null,
        suspendedAt: null,
      },
    });

    await logAdminAction({
      adminUserId: admin.id,
      action: "user.reactivate",
      targetType: "user",
      targetId: target.id,
      metadata: {
        previousReason: target.suspendedReason,
        email: target.email,
        name: target.name,
      },
    });

    afterUserChange(target.id);
    return NextResponse.json({ id: updated.id, suspended: updated.suspended });
  }

  if (action === "verifyDealer" || action === "unverifyDealer") {
    if (!target.dealer) {
      return jsonError("This user does not have a dealer profile.");
    }

    const verified = action === "verifyDealer";
    if (target.dealer.verified === verified) {
      return jsonError(verified ? "This dealer is already verified." : "This dealer is not verified.");
    }

    const dealer = await prisma.dealer.update({
      where: { id: target.dealer.id },
      data: { verified },
    });

    await logAdminAction({
      adminUserId: admin.id,
      action: verified ? "dealer.verify" : "dealer.unverify",
      targetType: "dealer",
      targetId: dealer.id,
      metadata: {
        userId: target.id,
        dealerName: dealer.name,
        email: target.email,
      },
    });

    afterUserChange(target.id);
    revalidatePath(`/dealers/${dealer.slug}`);
    return NextResponse.json({ id: dealer.id, verified: dealer.verified });
  }

  if (!target.email) {
    return jsonError("This user does not have an email address.");
  }

  const supabase = createSupabaseAuthClient();
  const { error } = await supabase.auth.resetPasswordForEmail(target.email, {
    redirectTo: getEmailRedirectTo(request, "/reset-password"),
  });
  if (error) {
    console.error("Failed to send admin password reset", error);
    return jsonError("Could not send a password reset email.", 502);
  }

  await logAdminAction({
    adminUserId: admin.id,
    action: "user.password_reset",
    targetType: "user",
    targetId: target.id,
    metadata: {
      email: target.email,
      name: target.name,
    },
  });

  afterUserChange(target.id);
  return NextResponse.json({ ok: true });
}
