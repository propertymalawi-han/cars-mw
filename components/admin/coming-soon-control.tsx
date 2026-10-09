"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_COMING_SOON_MESSAGE } from "@/lib/site-settings";

const MESSAGE_LIMIT = 280;

async function saveSettings(body: { comingSoonEnabled: boolean; comingSoonMessage: string }) {
  const response = await fetch("/api/admin/site-settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(json.error ?? "Could not update the coming soon page.");
  }
}

export function ComingSoonControl({
  enabled,
  message,
}: {
  enabled: boolean;
  message: string;
}) {
  const router = useRouter();
  const [comingSoonEnabled, setComingSoonEnabled] = useState(enabled);
  const [comingSoonMessage, setComingSoonMessage] = useState(message);
  const [savedMessage, setSavedMessage] = useState(message);
  const [pending, setPending] = useState(false);
  const [confirmOn, setConfirmOn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function persist(nextEnabled: boolean, nextMessage: string) {
    setPending(true);
    setError(null);
    try {
      await saveSettings({
        comingSoonEnabled: nextEnabled,
        comingSoonMessage: nextMessage,
      });
      setComingSoonEnabled(nextEnabled);
      setComingSoonMessage(nextMessage);
      setSavedMessage(nextMessage);
      setConfirmOn(false);
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Could not update the coming soon page.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="shadow-none">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 p-3 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-[13px] font-medium">Coming soon page</CardTitle>
          <CardDescription className="text-xs">
            {comingSoonEnabled
              ? "Visitors see a holding page while the site is updated. This dashboard stays open."
              : "Turn this on before an update so visitors know the site will be back shortly."}
          </CardDescription>
        </div>
        <Construction className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3 p-3 pt-0">
        <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
          <div>
            <p className="text-sm font-medium">
              {comingSoonEnabled ? "Visible to visitors" : "Site is live"}
            </p>
            <p className="text-xs text-muted-foreground">
              Staff can still browse the site and sign in at /admin.
            </p>
          </div>
          <Switch
            checked={comingSoonEnabled}
            disabled={pending}
            onCheckedChange={(checked) => {
              if (checked) {
                setConfirmOn(true);
                return;
              }
              void persist(false, comingSoonMessage);
            }}
            aria-label="Show the coming soon page"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="coming-soon-message">Message</Label>
            <span className="text-[0.7rem] tabular-nums text-muted-foreground">
              {comingSoonMessage.length}/{MESSAGE_LIMIT}
            </span>
          </div>
          <Textarea
            id="coming-soon-message"
            value={comingSoonMessage}
            maxLength={MESSAGE_LIMIT}
            rows={3}
            placeholder={DEFAULT_COMING_SOON_MESSAGE}
            onChange={(event) => setComingSoonMessage(event.target.value)}
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Leave this blank to use the standard message.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              disabled={pending || comingSoonMessage.trim() === savedMessage.trim()}
              onClick={() => void persist(comingSoonEnabled, comingSoonMessage.trim())}
            >
              Save message
            </Button>
          </div>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>

      <Dialog open={confirmOn} onOpenChange={setConfirmOn}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Show the coming soon page?</DialogTitle>
            <DialogDescription>
              Visitors will see a holding page until you turn this off. Staff stay signed in to
              this dashboard and can still open the live site.
            </DialogDescription>
          </DialogHeader>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setConfirmOn(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={pending}
              onClick={() => void persist(true, comingSoonMessage.trim())}
            >
              Turn on
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
