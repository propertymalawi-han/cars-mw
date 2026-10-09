"use client";

import { useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from "react";
import Image from "next/image";
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  RotateCcw,
  Star,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { prepareListingPhoto } from "@/lib/prepare-listing-photo";
import { cn } from "@/lib/utils";
import { MAX_LISTING_PHOTO_BYTES, MAX_LISTING_PHOTOS } from "@/lib/upload-limits";

type PhotoStatus = "resizing" | "uploading" | "done" | "failed";

type PendingPhoto = {
  id: string;
  file: File;
  preview: string;
  status: PhotoStatus;
  error?: string;
  url?: string;
};

const STATUS_LABEL: Record<Exclude<PhotoStatus, "done">, string> = {
  resizing: "Resizing…",
  uploading: "Uploading…",
  failed: "Failed",
};

export function PhotoUploader({
  value,
  onChange,
  onUploadingChange,
  disabled,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onUploadingChangeRef = useRef(onUploadingChange);
  onUploadingChangeRef.current = onUploadingChange;
  const itemsRef = useRef<PendingPhoto[]>([]);
  const activeRef = useRef(new Set<string>());
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  const [justDone, setJustDone] = useState<string[]>([]);
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = MAX_LISTING_PHOTOS - value.length - pending.length;

  function publishPending(next: PendingPhoto[]) {
    itemsRef.current = next;
    setPending(next);
  }

  function setBusy(id: string, busy: boolean) {
    if (busy) activeRef.current.add(id);
    else activeRef.current.delete(id);
    onUploadingChangeRef.current?.(activeRef.current.size > 0);
  }

  function appendUrls(urls: string[]) {
    if (urls.length === 0) return;
    const next = [...valueRef.current, ...urls];
    valueRef.current = next;
    onChangeRef.current(next);
    setJustDone((current) => [...current, ...urls]);
  }

  function releaseOrdered() {
    const urls: string[] = [];
    const kept: PendingPhoto[] = [];
    let blocked = false;
    for (const photo of itemsRef.current) {
      if (!blocked && photo.status === "done" && photo.url) {
        urls.push(photo.url);
        URL.revokeObjectURL(photo.preview);
        continue;
      }
      if (!blocked && photo.status === "failed") {
        kept.push(photo);
        continue;
      }
      blocked = true;
      kept.push(photo);
    }
    publishPending(kept);
    appendUrls(urls);
  }

  function updatePhoto(id: string, patch: Partial<PendingPhoto>, release = false) {
    if (!itemsRef.current.some((photo) => photo.id === id)) return;
    itemsRef.current = itemsRef.current.map((photo) =>
      photo.id === id ? { ...photo, ...patch } : photo,
    );
    if (release) releaseOrdered();
    else publishPending(itemsRef.current);
  }

  async function uploadBlob(file: File) {
    const body = new FormData();
    body.append("file", file);
    const response = await fetch("/api/uploads", { method: "POST", body });
    const json = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !json.url) {
      throw new Error(json.error ?? "Upload failed.");
    }
    return json.url;
  }

  async function processPhoto(id: string) {
    const photo = itemsRef.current.find((item) => item.id === id);
    if (!photo || activeRef.current.has(id)) return;

    setBusy(id, true);
    updatePhoto(id, { status: "resizing", error: undefined, url: undefined });
    try {
      const prepared = await prepareListingPhoto(photo.file);
      if (prepared.size > MAX_LISTING_PHOTO_BYTES) {
        throw new Error("Each photo must be 8 MB or smaller.");
      }
      if (!itemsRef.current.some((item) => item.id === id)) return;
      updatePhoto(id, { status: "uploading" });
      const url = await uploadBlob(prepared);
      updatePhoto(id, { status: "done", url, error: undefined }, true);
    } catch (uploadError) {
      updatePhoto(
        id,
        {
          status: "failed",
          url: undefined,
          error: uploadError instanceof Error ? uploadError.message : "Upload failed.",
        },
        true,
      );
    } finally {
      setBusy(id, false);
    }
  }

  async function uploadFiles(files: File[]) {
    if (disabled) return;
    const images = files.filter((file) => file.type.startsWith("image/") || file.type === "");
    const room = MAX_LISTING_PHOTOS - valueRef.current.length - itemsRef.current.length;
    const batch = images.slice(0, Math.max(room, 0));
    if (batch.length === 0) {
      setError(
        images.length === 0
          ? "Choose a photo from your camera or gallery."
          : `You can add up to ${MAX_LISTING_PHOTOS} photos.`,
      );
      return;
    }

    setError(null);
    const created: PendingPhoto[] = batch.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      status: "resizing",
    }));
    publishPending([...itemsRef.current, ...created]);

    let cursor = 0;
    async function worker() {
      while (cursor < created.length) {
        const item = created[cursor];
        cursor += 1;
        if (!item) break;
        await processPhoto(item.id);
      }
    }

    await Promise.all(Array.from({ length: Math.min(2, created.length) }, () => worker()));
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setOver(false);
    void uploadFiles(Array.from(event.dataTransfer.files));
  }

  function handleSelect(event: ChangeEvent<HTMLInputElement>) {
    void uploadFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function replaceValue(next: string[]) {
    valueRef.current = next;
    onChangeRef.current(next);
  }

  function remove(url: string) {
    replaceValue(valueRef.current.filter((item) => item !== url));
    setJustDone((current) => current.filter((item) => item !== url));
  }

  function makeCover(url: string) {
    replaceValue([url, ...valueRef.current.filter((item) => item !== url)]);
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= valueRef.current.length) return;
    const next = [...valueRef.current];
    const current = next[index];
    const swap = next[target];
    if (!current || !swap) return;
    next[index] = swap;
    next[target] = current;
    replaceValue(next);
  }

  function discardPending(id: string) {
    const photo = itemsRef.current.find((item) => item.id === id);
    if (!photo) return;
    URL.revokeObjectURL(photo.preview);
    itemsRef.current = itemsRef.current.filter((item) => item.id !== id);
    releaseOrdered();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add 5+ photos: front, back, both sides, interior, dashboard and odometer, engine.
      </p>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-card px-4 py-8 text-center transition-colors sm:px-6 sm:py-10",
          over ? "border-copper bg-copper/5" : "border-input hover:border-muted-foreground",
          (disabled || remaining <= 0) && "pointer-events-none opacity-50",
        )}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <ImagePlus className="mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-semibold">Add photos from your camera or gallery</p>
        <p className="mt-1 max-w-sm text-[0.8rem] text-muted-foreground">
          On a phone, choose Camera or Photo Library. On a computer, drag photos here.
          The first photo is the cover buyers see in search.
        </p>
        <span className="mt-3 inline-flex h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
          <Camera className="h-4 w-4" />
          Choose photos
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={handleSelect}
          disabled={disabled || remaining <= 0}
        />
      </div>

      {value.length > 0 || pending.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3">
          {value.map((url, index) => (
            <li key={url} className="overflow-hidden rounded-lg border bg-card">
              <div className="relative aspect-[16/10] w-full bg-muted">
                <Image
                  src={url}
                  alt={`Listing photo ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(min-width: 640px) 33vw, 50vw"
                />
                {index === 0 ? (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-card/95 px-2 py-0.5 text-[0.68rem] font-semibold">
                    <Star className="h-3 w-3 text-copper" />
                    Cover
                  </span>
                ) : null}
                {justDone.includes(url) ? (
                  <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-card/95 px-2 py-0.5 text-[0.68rem] font-semibold text-success">
                    <Check className="h-3 w-3" />
                    Done
                  </span>
                ) : null}
              </div>
              <div className="grid grid-cols-2 border-t">
                <TextAction
                  label={`Move photo ${index + 1} left`}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Left
                </TextAction>
                <TextAction
                  label={`Move photo ${index + 1} right`}
                  disabled={index === value.length - 1}
                  onClick={() => move(index, 1)}
                >
                  Right
                  <ChevronRight className="h-4 w-4" />
                </TextAction>
                <TextAction
                  label={index === 0 ? "This photo is the cover" : `Make photo ${index + 1} the cover`}
                  disabled={index === 0}
                  onClick={() => makeCover(url)}
                >
                  <Star className="h-4 w-4" />
                  {index === 0 ? "Cover" : "Make cover"}
                </TextAction>
                <TextAction label={`Remove photo ${index + 1}`} onClick={() => remove(url)}>
                  <X className="h-4 w-4" />
                  Remove
                </TextAction>
              </div>
            </li>
          ))}
          {pending.map((photo) => (
            <li key={photo.id} className="overflow-hidden rounded-lg border bg-card">
              <div className="relative aspect-[16/10] w-full bg-muted">
                {/* Local preview of a photo that has not been saved yet. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.preview}
                  alt=""
                  className={cn(
                    "h-full w-full object-cover",
                    photo.status !== "failed" && photo.status !== "done" && "opacity-70",
                  )}
                />
                {photo.status === "done" ? (
                  <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-card/95 px-2 py-0.5 text-[0.68rem] font-semibold text-success">
                    <Check className="h-3 w-3" />
                    Done
                  </span>
                ) : null}
                {photo.status === "resizing" || photo.status === "uploading" ? (
                  <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-foreground/35 text-card">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-xs font-semibold">{STATUS_LABEL[photo.status]}</span>
                  </span>
                ) : null}
                {photo.status === "failed" ? (
                  <span className="absolute inset-x-2 bottom-2 rounded-md bg-card/95 px-2 py-1 text-center text-[0.68rem] font-semibold text-destructive">
                    Failed
                  </span>
                ) : null}
              </div>
              <div className="border-t p-2">
                {photo.status === "failed" ? (
                  <div className="space-y-2">
                    <p className="text-[0.75rem] leading-snug text-destructive">
                      {photo.error ?? "Upload failed."}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 px-2"
                        onClick={() => void processPhoto(photo.id)}
                      >
                        <RotateCcw className="h-4 w-4" />
                        Retry
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 px-2"
                        onClick={() => discardPending(photo.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="flex h-11 items-center text-[0.75rem] text-muted-foreground">
                    {photo.status === "done" ? "Done" : STATUS_LABEL[photo.status]}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? <p className="text-[0.8rem] font-medium text-destructive">{error}</p> : null}
    </div>
  );
}

function TextAction({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="h-11 rounded-none px-1 text-[0.7rem]"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
