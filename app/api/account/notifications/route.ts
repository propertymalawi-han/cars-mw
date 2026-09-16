import { NextResponse } from "next/server";
import { requireApiUser, jsonError } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { notificationPreferenceSchema } from "@/lib/validations/account";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const parsed = notificationPreferenceSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Choose a valid notification setting.");

  const saved = await prisma.notificationPreference.upsert({
    where: {
      userId_key: { userId: user.id, key: parsed.data.key },
    },
    create: {
      userId: user.id,
      key: parsed.data.key,
      emailEnabled: parsed.data.emailEnabled,
      smsEnabled: parsed.data.smsEnabled,
      whatsappEnabled: parsed.data.whatsappEnabled,
    },
    update: {
      emailEnabled: parsed.data.emailEnabled,
      smsEnabled: parsed.data.smsEnabled,
      whatsappEnabled: parsed.data.whatsappEnabled,
    },
  });

  return NextResponse.json({
    key: saved.key,
    emailEnabled: saved.emailEnabled,
    smsEnabled: saved.smsEnabled,
    whatsappEnabled: saved.whatsappEnabled,
  });
}
