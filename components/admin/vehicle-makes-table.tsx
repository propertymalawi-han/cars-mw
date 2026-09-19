"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  CatalogRowActions,
  CatalogStatusBadge,
  deleteBlockedByListings,
} from "@/components/admin/catalog-row-actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminMakeRow } from "@/lib/admin-vehicle-data";
import { formatNumber } from "@/lib/currency";
import { slugify } from "@/lib/slug";
import type { CatalogMuteInput } from "@/lib/validations/admin";

async function readError(response: Response) {
  const json = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(json.error ?? "Could not update that make.");
}

export function AdminVehicleMakesTable({ makes }: { makes: AdminMakeRow[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<"create" | AdminMakeRow | null>(null);
  const [name, setName] = useState("");
  const [isPopular, setIsPopular] = useState(false);

  const slugPreview = useMemo(() => slugify(name, "make"), [name]);
  const editing = typeof dialog === "object" && dialog ? dialog : null;

  async function run(action: () => Promise<void>) {
    setPending(true);
    setError(null);
    try {
      await action();
      setDialog(null);
      setName("");
      setIsPopular(false);
      router.refresh();
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Could not update that make.");
    } finally {
      setPending(false);
    }
  }

  async function post(body: Record<string, unknown>) {
    const response = await fetch("/api/admin/vehicle-data/makes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await readError(response);
  }

  async function patch(id: string, body: Record<string, unknown>) {
    const response = await fetch(`/api/admin/vehicle-data/makes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await readError(response);
  }

  return (
    <div>
      <div className="flex items-center justify-end border-b px-3 py-2">
        <Button
          type="button"
          size="sm"
          className="h-8"
          onClick={() => {
            setName("");
            setIsPopular(false);
            setDialog("create");
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          Add make
        </Button>
      </div>
      {error ? (
        <p className="border-b px-3 py-2 text-sm text-destructive">{error}</p>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="h-9">Make</TableHead>
            <TableHead className="h-9 text-right">Models</TableHead>
            <TableHead className="h-9 text-right">Variants</TableHead>
            <TableHead className="h-9 text-right">Listings</TableHead>
            <TableHead className="h-9">Popular</TableHead>
            <TableHead className="h-9">Status</TableHead>
            <TableHead className="h-9 w-12">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {makes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                No makes in the catalog yet.
              </TableCell>
            </TableRow>
          ) : (
            makes.map((make) => (
              <TableRow key={make.id}>
                <TableCell className="py-2 font-medium">{make.name}</TableCell>
                <TableCell className="py-2 text-right tabular-nums">
                  {formatNumber(make.modelCount)}
                </TableCell>
                <TableCell className="py-2 text-right tabular-nums">
                  {formatNumber(make.variantCount)}
                </TableCell>
                <TableCell className="py-2 text-right tabular-nums">
                  {formatNumber(make.listingCount)}
                </TableCell>
                <TableCell className="py-2">
                  <Switch
                    checked={make.isPopular}
                    disabled={pending}
                    aria-label={`Mark ${make.name} as popular`}
                    onCheckedChange={(checked) =>
                      void run(() =>
                        patch(make.id, { action: "update", isPopular: checked }),
                      )
                    }
                  />
                </TableCell>
                <TableCell className="py-2">
                  <CatalogStatusBadge status={make.status} mutedUntil={make.mutedUntil} />
                </TableCell>
                <TableCell className="py-2">
                  <CatalogRowActions
                    noun="make"
                    name={make.name}
                    status={make.status}
                    deleteBlockedReason={deleteBlockedByListings(make.listingCount, "make")}
                    pending={pending}
                    editLabel="Edit"
                    onEdit={() => {
                      setName(make.name);
                      setIsPopular(make.isPopular);
                      setDialog(make);
                    }}
                    onMute={(mute: CatalogMuteInput) =>
                      void run(() => patch(make.id, { action: "mute", mute }))
                    }
                    onUnmute={() => void run(() => patch(make.id, { action: "unmute" }))}
                    onDelete={() => void run(() => patch(make.id, { action: "delete" }))}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
            setName("");
            setIsPopular(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog === "create" ? "Add make" : "Edit make"}</DialogTitle>
            <DialogDescription>
              {dialog === "create"
                ? "The slug is generated from the name and used internally."
                : "Rename this make. Existing listings keep the name they were posted with."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="make-name">Name</Label>
              <Input
                id="make-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Toyota"
              />
              <p className="text-xs text-muted-foreground">Slug: {slugPreview}</p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={isPopular}
                onCheckedChange={(checked) => setIsPopular(checked === true)}
              />
              Mark as popular
            </label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDialog(null);
                setName("");
                setIsPopular(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={pending || name.trim().length === 0}
              onClick={() => {
                if (dialog === "create") {
                  void run(() => post({ name: name.trim(), isPopular }));
                  return;
                }
                if (editing) {
                  void run(() =>
                    patch(editing.id, {
                      action: "update",
                      name: name.trim(),
                      isPopular,
                    }),
                  );
                }
              }}
            >
              {dialog === "create" ? "Add make" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
