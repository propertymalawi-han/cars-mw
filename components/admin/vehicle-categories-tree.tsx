"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminCategoryRow } from "@/lib/admin-vehicle-data";
import { formatNumber } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { CatalogMuteInput } from "@/lib/validations/admin";

async function readError(response: Response) {
  const json = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(json.error ?? "Could not update that category.");
}

type CategoryFormState = {
  name: string;
  parentId: string;
  sortOrder: string;
};

function emptyForm(): CategoryFormState {
  return { name: "", parentId: "none", sortOrder: "" };
}

function flattenCategories(
  nodes: AdminCategoryRow[],
  depth = 0,
  exclude?: Set<string>,
): { row: AdminCategoryRow; depth: number }[] {
  return nodes.flatMap((node) => {
    if (exclude?.has(node.id)) return [];
    return [
      { row: node, depth },
      ...flattenCategories(node.children, depth + 1, exclude),
    ];
  });
}

function descendantIds(node: AdminCategoryRow): Set<string> {
  const ids = new Set<string>([node.id]);
  for (const child of node.children) {
    for (const id of Array.from(descendantIds(child))) ids.add(id);
  }
  return ids;
}

function findCategory(nodes: AdminCategoryRow[], id: string): AdminCategoryRow | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const nested = findCategory(node.children, id);
    if (nested) return nested;
  }
  return undefined;
}

export function AdminVehicleCategoriesTree({
  categories,
}: {
  categories: AdminCategoryRow[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(categories.map((row) => [row.id, true])),
  );
  const [dialog, setDialog] = useState<"create" | AdminCategoryRow | null>(null);
  const [form, setForm] = useState<CategoryFormState>(emptyForm());

  const editing = typeof dialog === "object" && dialog ? dialog : null;
  const parentOptions = useMemo(() => {
    const exclude = editing ? descendantIds(editing) : undefined;
    return flattenCategories(categories, 0, exclude);
  }, [categories, editing]);

  const visibleRows = flattenCategories(categories).filter(({ row, depth }) => {
    if (depth === 0) return true;
    let parentId = row.parentId;
    while (parentId) {
      if (expanded[parentId] === false) return false;
      const parent = findCategory(categories, parentId);
      parentId = parent?.parentId ?? null;
    }
    return true;
  });

  async function run(action: () => Promise<void>) {
    setPending(true);
    setError(null);
    try {
      await action();
      setDialog(null);
      setForm(emptyForm());
      router.refresh();
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Could not update that category.");
    } finally {
      setPending(false);
    }
  }

  async function post(body: Record<string, unknown>) {
    const response = await fetch("/api/admin/vehicle-data/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await readError(response);
  }

  async function patch(id: string, body: Record<string, unknown>) {
    const response = await fetch(`/api/admin/vehicle-data/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await readError(response);
  }

  function openCreate() {
    setForm(emptyForm());
    setDialog("create");
  }

  function openEdit(row: AdminCategoryRow) {
    setForm({
      name: row.name,
      parentId: row.parentId ?? "none",
      sortOrder: String(row.sortOrder),
    });
    setDialog(row);
  }

  function submitForm() {
    const payload = {
      name: form.name.trim(),
      parentId: form.parentId,
      sortOrder: form.sortOrder === "" ? undefined : Number(form.sortOrder),
    };
    if (dialog === "create") {
      void run(() => post(payload));
      return;
    }
    if (editing) {
      void run(() => patch(editing.id, { action: "update", ...payload }));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-end border-b px-3 py-2">
        <Button type="button" size="sm" className="h-8" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" />
          Add category
        </Button>
      </div>
      {error ? (
        <p className="border-b px-3 py-2 text-sm text-destructive">{error}</p>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="h-9">Category</TableHead>
            <TableHead className="h-9 text-right">Listings</TableHead>
            <TableHead className="h-9">Status</TableHead>
            <TableHead className="h-9 w-12">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                No categories yet.
              </TableCell>
            </TableRow>
          ) : (
            visibleRows.map(({ row, depth }) => {
              const hasChildren = row.childCount > 0;
              const deleteReason =
                hasChildren
                  ? "Move or delete child categories first."
                  : deleteBlockedByListings(row.listingCount, "category");
              return (
                <TableRow key={row.id}>
                  <TableCell className="py-2">
                    <div
                      className="flex min-w-0 items-center gap-1"
                      style={{ paddingLeft: depth * 20 }}
                    >
                      {hasChildren ? (
                        <button
                          type="button"
                          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                          aria-label={expanded[row.id] === false ? "Expand" : "Collapse"}
                          onClick={() =>
                            setExpanded((current) => ({
                              ...current,
                              [row.id]: current[row.id] === false,
                            }))
                          }
                        >
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform",
                              expanded[row.id] === false ? "-rotate-90" : "rotate-0",
                            )}
                          />
                        </button>
                      ) : (
                        <span className="w-7" />
                      )}
                      <span className="truncate font-medium">{row.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 text-right tabular-nums">
                    {formatNumber(row.listingCount)}
                  </TableCell>
                  <TableCell className="py-2">
                    <CatalogStatusBadge status={row.status} mutedUntil={row.mutedUntil} />
                  </TableCell>
                  <TableCell className="py-2">
                    <CatalogRowActions
                      noun="category"
                      name={row.name}
                      status={row.status}
                      deleteBlockedReason={deleteReason}
                      pending={pending}
                      onEdit={() => openEdit(row)}
                      onMute={(mute: CatalogMuteInput) =>
                        void run(() => patch(row.id, { action: "mute", mute }))
                      }
                      onUnmute={() => void run(() => patch(row.id, { action: "unmute" }))}
                      onDelete={() => void run(() => patch(row.id, { action: "delete" }))}
                    />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
            setForm(emptyForm());
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog === "create" ? "Add category" : "Edit category"}</DialogTitle>
            <DialogDescription>
              {dialog === "create"
                ? "Top-level categories appear in the public search dropdown. Nested categories sit under Leisure or Commercial style groups."
                : "Rename this category or move it in the tree."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Cars"
              />
            </div>
            <div className="space-y-2">
              <Label>Parent category</Label>
              <Select
                value={form.parentId}
                onValueChange={(parentId) => setForm((current) => ({ ...current, parentId }))}
              >
                <SelectTrigger aria-label="Parent category">
                  <SelectValue placeholder="None (top-level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (top-level)</SelectItem>
                  {parentOptions.map(({ row, depth }) => (
                    <SelectItem key={row.id} value={row.id}>
                      {`${"— ".repeat(depth)}${row.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-sort">Sort order</Label>
              <Input
                id="category-sort"
                type="number"
                inputMode="numeric"
                min={0}
                value={form.sortOrder}
                onChange={(event) =>
                  setForm((current) => ({ ...current, sortOrder: event.target.value }))
                }
                placeholder="Leave blank to append"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDialog(null);
                setForm(emptyForm());
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={pending || form.name.trim().length === 0}
              onClick={submitForm}
            >
              {dialog === "create" ? "Add category" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
