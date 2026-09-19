"use client";

import { useState, type ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDate } from "@/lib/format-date";
import type { CatalogMuteInput } from "@/lib/validations/admin";

function tomorrowIsoDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function CatalogStatusBadge({
  status,
  mutedUntil,
}: {
  status: "active" | "muted";
  mutedUntil?: string | null;
}) {
  if (status !== "muted") {
    return (
      <Badge variant="success" className="px-1.5 py-0 text-[0.62rem]">
        Active
      </Badge>
    );
  }

  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <Badge variant="destructive" className="px-1.5 py-0 text-[0.62rem]">
        Muted
      </Badge>
      {mutedUntil ? (
        <span className="text-[0.65rem] text-muted-foreground">
          until {formatDate(mutedUntil)}
        </span>
      ) : (
        <span className="text-[0.65rem] text-muted-foreground">indefinitely</span>
      )}
    </span>
  );
}

export function CatalogRowActions({
  noun,
  name,
  status,
  deleteBlockedReason,
  pending,
  extraItems,
  editLabel = "Edit name",
  onEdit,
  onMute,
  onUnmute,
  onDelete,
}: {
  noun: string;
  name: string;
  status: "active" | "muted";
  deleteBlockedReason?: string;
  pending?: boolean;
  extraItems?: ReactNode;
  editLabel?: string;
  onEdit?: () => void;
  onMute: (mute: CatalogMuteInput) => void;
  onUnmute: () => void;
  onDelete: () => void;
}) {
  const [muteOpen, setMuteOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [mode, setMode] = useState<"indefinite" | "until">("indefinite");
  const [until, setUntil] = useState(tomorrowIsoDate());
  const canDelete = !deleteBlockedReason;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={pending}
            aria-label={`Actions for ${name}`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {extraItems}
          {onEdit ? (
            <DropdownMenuItem
              onSelect={() => {
                onEdit();
              }}
            >
              {editLabel}
            </DropdownMenuItem>
          ) : null}
          {status === "muted" ? (
            <DropdownMenuItem onSelect={() => onUnmute()}>Unmute</DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => setMuteOpen(true)}>Mute</DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {canDelete ? (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => setDeleteOpen(true)}
            >
              Delete
            </DropdownMenuItem>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="block">
                  <DropdownMenuItem disabled>Delete</DropdownMenuItem>
                </span>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                {deleteBlockedReason}
              </TooltipContent>
            </Tooltip>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={muteOpen} onOpenChange={setMuteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mute {noun}</DialogTitle>
            <DialogDescription>
              {name} will be hidden from search category pickers, the make/model
              picker, and the sell flow. Existing listings stay visible.
            </DialogDescription>
          </DialogHeader>
          <RadioGroup
            value={mode}
            onValueChange={(value) => setMode(value as "indefinite" | "until")}
            className="space-y-3"
          >
            <div className="flex items-start gap-3 rounded-md border p-3">
              <RadioGroupItem value="indefinite" id={`mute-indefinite-${name}`} />
              <div className="space-y-1">
                <Label htmlFor={`mute-indefinite-${name}`}>Mute indefinitely</Label>
                <p className="text-xs text-muted-foreground">
                  Stays muted until you unmute it.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-md border p-3">
              <RadioGroupItem value="until" id={`mute-until-${name}`} />
              <div className="min-w-0 flex-1 space-y-2">
                <Label htmlFor={`mute-until-${name}`}>Mute until a date</Label>
                <Input
                  type="date"
                  min={tomorrowIsoDate()}
                  value={until}
                  disabled={mode !== "until"}
                  onChange={(event) => setUntil(event.target.value)}
                />
              </div>
            </div>
          </RadioGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setMuteOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={pending || (mode === "until" && !until)}
              onClick={() => {
                onMute(
                  mode === "until"
                    ? { mode: "until", until }
                    : { mode: "indefinite" },
                );
                setMuteOpen(false);
              }}
            >
              Mute {noun}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {noun}</DialogTitle>
            <DialogDescription>
              This removes {name} from the vehicle catalog. You can only delete it
              because nothing currently references it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => {
                onDelete();
                setDeleteOpen(false);
              }}
            >
              Delete {noun}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function deleteBlockedByListings(count: number, noun: string) {
  if (count <= 0) return undefined;
  return `This ${noun} still has ${count} listing${count === 1 ? "" : "s"}. Mute it instead, or remove those listings from the Listings page first.`;
}
