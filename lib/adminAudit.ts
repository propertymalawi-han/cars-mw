import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type LogAdminActionInput = {
  adminUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Prisma.InputJsonValue;
};

export async function logAdminAction({
  adminUserId,
  action,
  targetType,
  targetId,
  metadata,
}: LogAdminActionInput) {
  return prisma.adminAuditLog.create({
    data: {
      adminUserId,
      action,
      targetType,
      targetId,
      metadata: metadata ?? {},
    },
  });
}
