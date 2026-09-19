import type { Metadata } from "next";
import { ViewHistoryList } from "@/components/account/view-history-list";
import { getViewHistory } from "@/lib/account";
import { requirePageUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Recent activity",
};

export const dynamic = "force-dynamic";

export default async function RecentActivityPage() {
  const user = await requirePageUser("/account/recent-activity");
  const items = await getViewHistory(user.id);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-[clamp(1.5rem,1.1rem+2vw,1.875rem)] font-semibold tracking-tight">
          Recent activity
        </h1>
        <p className="text-muted-foreground">
          The last 50 listings you viewed, newest first.
        </p>
      </div>
      <ViewHistoryList items={items} />
    </div>
  );
}
