import { prisma } from "@/lib/prisma";
import { isPlausiblePhone } from "@/lib/phone";

export async function saveProfilePhone(userId: string, phone: string, accountType?: string | null) {
  const trimmed = phone.trim();
  if (!isPlausiblePhone(trimmed) || !process.env.DATABASE_URL) return;

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { phone: trimmed },
    });
    if (accountType === "dealer") {
      await prisma.dealer.updateMany({
        where: { userId },
        data: { phone: trimmed },
      });
    }
  } catch (error) {
    console.error("Failed to save profile phone", error);
  }
}
