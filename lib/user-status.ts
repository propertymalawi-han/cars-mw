import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const ACCOUNT_SUSPENDED_MESSAGE = "This account has been suspended.";

export async function getUserSuspension(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      suspended: true,
      suspendedReason: true,
      suspendedAt: true,
    },
  });
}

export async function jsonIfSuspended(userId: string) {
  try {
    const user = await getUserSuspension(userId);
    if (user?.suspended) {
      return NextResponse.json({ error: ACCOUNT_SUSPENDED_MESSAGE }, { status: 403 });
    }
  } catch (error) {
    console.error("Failed to check account status", error);
  }
  return null;
}

export async function isUserSuspended(userId?: string | null, email?: string | null) {
  const clauses = [];
  if (userId) clauses.push({ id: userId });
  if (email) clauses.push({ email: email.toLowerCase() });
  if (clauses.length === 0) return false;

  try {
    const user = await prisma.user.findFirst({
      where: clauses.length === 1 ? clauses[0] : { OR: clauses },
      select: { suspended: true },
    });
    return Boolean(user?.suspended);
  } catch (error) {
    console.error("Failed to check account status", error);
    return false;
  }
}

export async function revokeUserSessions(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
  try {
    await prisma.$executeRaw`DELETE FROM auth.sessions WHERE user_id = ${userId}::uuid`;
  } catch (error) {
    console.error("Failed to revoke auth sessions", error);
  }
}
