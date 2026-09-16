import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function requirePageUser(returnTo: string) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/sign-in?returnTo=${encodeURIComponent(returnTo)}`);
  }
  return user;
}
