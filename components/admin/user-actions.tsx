"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import type { AdminUserDetail } from "@/lib/admin-users";

async function readError(response: Response) {
  const json = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(json.error ?? "Could not update that user.");
  }
}

export function AdminDealerVerifyToggle({
  userId,
  verified,
  dealerName,
}: {
  userId: string;
  verified: boolean;
  dealerName: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle(next: boolean) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: next ? "verifyDealer" : "unverifyDealer" }),
      });
      await readError(response);
      router.refresh();
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Could not update verification.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
        <div>
          <p className="text-sm font-medium">Verified dealer</p>
          <p className="text-xs text-muted-foreground">
            {verified
              ? `${dealerName} shows as verified on public pages.`
              : `${dealerName} is waiting for staff review.`}
          </p>
        </div>
        <Switch
          checked={verified}
          disabled={pending}
          onCheckedChange={(checked) => void toggle(checked)}
          aria-label="Toggle dealer verification"
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

export function AdminUserActions({ user }: { user: AdminUserDetail }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [reason, setReason] = useState("");

  async function run(action: () => Promise<string>) {
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const nextMessage = await action();
      setSuspendOpen(false);
      setReason("");
      setMessage(nextMessage);
      router.refresh();
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Could not update that user.");
    } finally {
      setPending(false);
    }
  }

  async function patch(body: Record<string, unknown>) {
    const response = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await readError(response);
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? <p className="text-sm text-success">{message}</p> : null}

      {user.suspended ? (
        <div className="space-y-2 rounded-md border p-3">
          <p className="text-sm font-medium">Reactivate account</p>
          <p className="text-sm text-muted-foreground">
            This user can sign in and post listings again. Existing listings are unchanged.
          </p>
          {user.suspendedReason ? (
            <p className="text-sm text-muted-foreground">
              Suspended for: {user.suspendedReason}
            </p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            disabled={pending}
            onClick={() =>
              void run(async () => {
                await patch({ action: "reactivate" });
                return "Account reactivated.";
              })
            }
          >
            Reactivate
          </Button>
        </div>
      ) : (
        <div className="space-y-2 rounded-md border p-3">
          <p className="text-sm font-medium">Suspend account</p>
          <p className="text-sm text-muted-foreground">
            Suspended users cannot sign in or post new listings. Existing listings stay as they
            are unless you mute them separately.
          </p>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="h-8"
            disabled={pending}
            onClick={() => {
              setReason("");
              setSuspendOpen(true);
            }}
          >
            Suspend account
          </Button>
        </div>
      )}

      <div className="space-y-2 rounded-md border p-3">
        <p className="text-sm font-medium">Send password reset email</p>
        <p className="text-sm text-muted-foreground">
          Sends the same reset email the user would get from the forgot-password page.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          disabled={pending}
          onClick={() =>
            void run(async () => {
              await patch({ action: "sendPasswordReset" });
              return "Password reset email sent.";
            })
          }
        >
          Send password reset email
        </Button>
      </div>

      <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend account</DialogTitle>
            <DialogDescription>
              {user.name} will not be able to sign in or post new listings. Existing listings
              stay public unless you mute them.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="suspend-reason">Reason</Label>
            <Textarea
              id="suspend-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Why is this account being suspended?"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSuspendOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending || reason.trim().length === 0}
              onClick={() =>
                void run(async () => {
                  await patch({ action: "suspend", reason: reason.trim() });
                  return "Account suspended.";
                })
              }
            >
              Suspend account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
