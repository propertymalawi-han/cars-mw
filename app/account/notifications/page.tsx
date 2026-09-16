import type { Metadata } from "next";
import { NotificationSettings } from "@/components/account/notification-settings";
import { getNotificationPreferences } from "@/lib/account";
import { requirePageUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Notification settings",
};

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requirePageUser("/account/notifications");
  const preferences = await getNotificationPreferences(user.id);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-[clamp(1.5rem,1.1rem+2vw,1.875rem)] font-semibold tracking-tight">
          Notification settings
        </h1>
        <p className="text-muted-foreground">
          Choose what we send you, and whether that is email, SMS, or WhatsApp.
        </p>
      </div>
      <NotificationSettings initial={preferences} />
    </div>
  );
}
