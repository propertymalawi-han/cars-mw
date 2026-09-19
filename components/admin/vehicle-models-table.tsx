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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  vehicleDataHref,
  type AdminMakeOption,
  type AdminModelRow,
  type AdminVariantRow,
} from "@/lib/admin-vehicle-data";
import { formatNumber } from "@/lib/currency";
import type { CatalogMuteInput } from "@/lib/validations/admin";
import { BODY_TYPE_LABELS, BODY_TYPES, FUEL_TYPES } from "@/types";

async function readError(response: Response) {
  const json = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(json.error ?? "Could not update vehicle data.");
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function AdminVehicleModelsTable({
  makeOptions,
  selectedMakeId,
  models,
}: {
  makeOptions: AdminMakeOption[];
  selectedMakeId: string | null;
  models: AdminModelRow[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<"create" | AdminModelRow | null>(null);
  const [sheetModel, setSheetModel] = useState<AdminModelRow | null>(null);
  const [makeId, setMakeId] = useState(selectedMakeId ?? "");
  const [name, setName] = useState("");
  const [bodyType, setBodyType] = useState<(typeof BODY_TYPES)[number]>("sedan");
  const [variantName, setVariantName] = useState("");
  const [variantFuel, setVariantFuel] = useState<(typeof FUEL_TYPES)[number]>("petrol");
  const [editingVariant, setEditingVariant] = useState<AdminVariantRow | null>(null);

  const editing = typeof dialog === "object" && dialog ? dialog : null;
  const sheetVariants = useMemo(
    () => (sheetModel ? models.find((model) => model.id === sheetModel.id)?.variants ?? sheetModel.variants : []),
    [models, sheetModel],
  );

  async function run(action: () => Promise<void>) {
    setPending(true);
    setError(null);
    try {
      await action();
      setDialog(null);
      setName("");
      setBodyType("sedan");
      setVariantName("");
      setEditingVariant(null);
      router.refresh();
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Could not update vehicle data.");
    } finally {
      setPending(false);
    }
  }

  async function post(path: string, body: Record<string, unknown>) {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await readError(response);
  }

  async function patch(path: string, body: Record<string, unknown>) {
    const response = await fetch(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await readError(response);
  }

  return (
    <div>
      <div className="flex flex-col gap-2 border-b px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <Select
            value={selectedMakeId ?? ""}
            onValueChange={(value) => router.push(vehicleDataHref("models", value))}
          >
            <SelectTrigger className="h-8 md:h-8" aria-label="Filter by make">
              <SelectValue placeholder="Select a make" />
            </SelectTrigger>
            <SelectContent>
              {makeOptions.map((make) => (
                <SelectItem key={make.id} value={make.id}>
                  {make.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          size="sm"
          className="h-8"
          onClick={() => {
            setMakeId(selectedMakeId ?? "");
            setName("");
            setBodyType("sedan");
            setDialog("create");
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          Add model
        </Button>
      </div>
      {error ? (
        <p className="border-b px-3 py-2 text-sm text-destructive">{error}</p>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="h-9">Model</TableHead>
            <TableHead className="h-9">Body type</TableHead>
            <TableHead className="h-9 text-right">Variants</TableHead>
            <TableHead className="h-9 text-right">Listings</TableHead>
            <TableHead className="h-9">Status</TableHead>
            <TableHead className="h-9 w-12">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!selectedMakeId ? (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                Select a make to view its models.
              </TableCell>
            </TableRow>
          ) : models.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                No models for this make yet.
              </TableCell>
            </TableRow>
          ) : (
            models.map((model) => (
              <TableRow key={model.id}>
                <TableCell className="py-2 font-medium">{model.name}</TableCell>
                <TableCell className="py-2">{BODY_TYPE_LABELS[model.bodyType]}</TableCell>
                <TableCell className="py-2 text-right tabular-nums">
                  {formatNumber(model.variantCount)}
                </TableCell>
                <TableCell className="py-2 text-right tabular-nums">
                  {formatNumber(model.listingCount)}
                </TableCell>
                <TableCell className="py-2">
                  <CatalogStatusBadge status={model.status} mutedUntil={model.mutedUntil} />
                </TableCell>
                <TableCell className="py-2">
                  <CatalogRowActions
                    noun="model"
                    name={model.name}
                    status={model.status}
                    deleteBlockedReason={deleteBlockedByListings(model.listingCount, "model")}
                    pending={pending}
                    editLabel="Edit"
                    extraItems={
                      <DropdownMenuItem
                        onSelect={() => {
                          setSheetModel(model);
                          setVariantName("");
                          setEditingVariant(null);
                        }}
                      >
                        Manage variants
                      </DropdownMenuItem>
                    }
                    onEdit={() => {
                      setMakeId(model.makeId);
                      setName(model.name);
                      setBodyType(model.bodyType);
                      setDialog(model);
                    }}
                    onMute={(mute: CatalogMuteInput) =>
                      void run(() =>
                        patch(`/api/admin/vehicle-data/models/${model.id}`, {
                          action: "mute",
                          mute,
                        }),
                      )
                    }
                    onUnmute={() =>
                      void run(() =>
                        patch(`/api/admin/vehicle-data/models/${model.id}`, {
                          action: "unmute",
                        }),
                      )
                    }
                    onDelete={() =>
                      void run(() =>
                        patch(`/api/admin/vehicle-data/models/${model.id}`, {
                          action: "delete",
                        }),
                      )
                    }
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
          if (!open) setDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog === "create" ? "Add model" : "Edit model"}</DialogTitle>
            <DialogDescription>
              Models belong to a make and can carry their own mute status.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Make</Label>
              <Select value={makeId} onValueChange={setMakeId}>
                <SelectTrigger aria-label="Select make">
                  <SelectValue placeholder="Select make" />
                </SelectTrigger>
                <SelectContent>
                  {makeOptions.map((make) => (
                    <SelectItem key={make.id} value={make.id}>
                      {make.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="model-name">Name</Label>
              <Input
                id="model-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Hilux"
              />
            </div>
            <div className="space-y-2">
              <Label>Body type</Label>
              <Select
                value={bodyType}
                onValueChange={(value) => setBodyType(value as (typeof BODY_TYPES)[number])}
              >
                <SelectTrigger aria-label="Body type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BODY_TYPES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {BODY_TYPE_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={pending || !makeId || name.trim().length === 0}
              onClick={() => {
                if (dialog === "create") {
                  void run(() =>
                    post("/api/admin/vehicle-data/models", {
                      makeId,
                      name: name.trim(),
                      bodyType,
                    }),
                  );
                  return;
                }
                if (editing) {
                  void run(() =>
                    patch(`/api/admin/vehicle-data/models/${editing.id}`, {
                      action: "update",
                      makeId,
                      name: name.trim(),
                      bodyType,
                    }),
                  );
                }
              }}
            >
              {dialog === "create" ? "Add model" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet
        open={sheetModel !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSheetModel(null);
            setEditingVariant(null);
            setVariantName("");
          }
        }}
      >
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Variants</SheetTitle>
            <SheetDescription>
              {sheetModel
                ? `${sheetModel.makeName} ${sheetModel.name}. Variants do not use mute; delete is blocked if listings still reference them.`
                : "Manage variants for this model."}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="grid gap-2 sm:grid-cols-[1fr_8rem_auto]">
              <Input
                value={variantName}
                onChange={(event) => setVariantName(event.target.value)}
                placeholder={editingVariant ? "Rename variant" : "New variant"}
              />
              <Select
                value={variantFuel}
                onValueChange={(value) => setVariantFuel(value as (typeof FUEL_TYPES)[number])}
              >
                <SelectTrigger className="h-11" aria-label="Fuel type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FUEL_TYPES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {titleCase(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                disabled={pending || !sheetModel || variantName.trim().length === 0}
                onClick={() => {
                  if (!sheetModel) return;
                  if (editingVariant) {
                    void run(async () => {
                      await patch(`/api/admin/vehicle-data/variants/${editingVariant.id}`, {
                        action: "update",
                        name: variantName.trim(),
                        fuelType: variantFuel,
                      });
                      setSheetModel((current) => current);
                    });
                    return;
                  }
                  void run(() =>
                    post("/api/admin/vehicle-data/variants", {
                      modelId: sheetModel.id,
                      name: variantName.trim(),
                      fuelType: variantFuel,
                    }),
                  );
                }}
              >
                {editingVariant ? "Save" : "Add"}
              </Button>
            </div>
            {editingVariant ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-0"
                onClick={() => {
                  setEditingVariant(null);
                  setVariantName("");
                  setVariantFuel("petrol");
                }}
              >
                Cancel rename
              </Button>
            ) : null}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-9">Variant</TableHead>
                  <TableHead className="h-9">Fuel</TableHead>
                  <TableHead className="h-9 text-right">Listings</TableHead>
                  <TableHead className="h-9 w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sheetVariants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                      No variants yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  sheetVariants.map((variant) => (
                    <TableRow key={variant.id}>
                      <TableCell className="py-2 font-medium">{variant.name}</TableCell>
                      <TableCell className="py-2">{titleCase(variant.fuelType)}</TableCell>
                      <TableCell className="py-2 text-right tabular-nums">
                        {formatNumber(variant.listingCount)}
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            onClick={() => {
                              setEditingVariant(variant);
                              setVariantName(variant.name);
                              setVariantFuel(variant.fuelType);
                            }}
                          >
                            Rename
                          </Button>
                          {variant.listingCount > 0 ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button type="button" variant="ghost" size="sm" className="h-8" disabled>
                                    Delete
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                {deleteBlockedByListings(variant.listingCount, "variant")}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 text-destructive"
                              disabled={pending}
                              onClick={() =>
                                void run(() =>
                                  patch(`/api/admin/vehicle-data/variants/${variant.id}`, {
                                    action: "delete",
                                  }),
                                )
                              }
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
