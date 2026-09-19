import { redirect } from "next/navigation";
import { jsonError, requireApiUser } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isStaffRole } from "@/types";

export { isConfiguredAdminEmail } from "@/lib/auth-env";

export async function requireAdminPage(returnTo = "/admin") {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/sign-in?returnTo=${encodeURIComponent(returnTo)}`);
  }

  if (isStaffRole(user.role)) {
    return user;
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });
    if (isStaffRole(dbUser?.role)) {
      return { ...user, role: dbUser.role };
    }
  } catch (error) {
    console.error("Failed to verify admin role", error);
  }

  redirect("/403");
}

export async function requireAdminUser() {
  const { user, response } = await requireApiUser();
  if (!user) return { user: null, response };

  if (isStaffRole(user.role)) {
    return { user, response: null };
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });
    if (isStaffRole(dbUser?.role)) {
      return { user: { ...user, role: dbUser.role }, response: null };
    }
  } catch (error) {
    console.error("Failed to verify admin role", error);
  }

  return { user: null, response: jsonError("Not authorized.", 403) };
}
