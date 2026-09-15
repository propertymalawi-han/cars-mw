"use client";

import { useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MAX_LISTING_PHOTO_BYTES, MAX_LISTING_PHOTOS } from "@/lib/upload-limits";

type PendingPhoto = {
  id: string;
  preview: string;
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
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = MAX_LISTING_PHOTOS - value.length - pending.length;
  const uploading = pending.length > 0;

  async function uploadFiles(files: File[]) {
    if (disabled) return;
    const selected = files.slice(0, Math.max(remaining, 0));
    if (selected.length === 0) {
      setError(`You can add up to ${MAX_LISTING_PHOTOS} photos.`);
      return;
    }

    setError(null);
    const nextPending = selected.map((file) => ({
      id: crypto.randomUUID(),
      preview: URL.createObjectURL(file),
      file,
    }));
    setPending((current) => [
      ...current,
      ...nextPending.map(({ id, preview }) => ({ id, preview })),
    ]);
    onUploadingChange?.(true);

    const uploaded: string[] = [];
    for (const item of nextPending) {
      try {
        if (item.file.size > MAX_LISTING_PHOTO_BYTES) {
          throw new Error("Each photo must be 8 MB or smaller.");
        }
        const body = new FormData();
        body.append("file", item.file);
        const response = await fetch("/api/uploads", { method: "POST", body });
        const json = (await response.json()) as { url?: string; error?: string };
        if (!response.ok || !json.url) {
          throw new Error(json.error ?? "Upload failed.");
        }
        uploaded.push(json.url);
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
      } finally {
        URL.revokeObjectURL(item.preview);
        setPending((current) => current.filter((photo) => photo.id !== item.id));
      }
    }

    if (uploaded.length > 0) {
      onChange([...value, ...uploaded]);
    }
    onUploadingChange?.(false);
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

  function remove(url: string) {
    onChange(value.filter((item) => item !== url));
  }

  function makeCover(url: string) {
    onChange([url, ...value.filter((item) => item !== url)]);
  }

  return (
    <div className="space-y-4">
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
          disabled && "pointer-events-none opacity-50",
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
        <p className="text-sm font-semibold">Drag photos here, or click to browse</p>
        <p className="mt-1 max-w-sm text-[0.8rem] text-muted-foreground">
          JPG, PNG, or WebP up to 8 MB. First photo is the cover buyers see in search.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="sr-only"
          onChange={handleSelect}
          disabled={disabled || remaining <= 0}
        />
      </div>

      {value.length > 0 || pending.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((url, index) => (
            <li key={url} className="group relative overflow-hidden rounded-lg border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Listing photo ${index + 1}`} className="aspect-[16/10] w-full object-cover" />
              {index === 0 ? (
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-card/95 px-2 py-0.5 text-[0.68rem] font-semibold">
                  <Star className="h-3 w-3 text-copper" />
                  Cover
                </span>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="absolute left-2 top-2 h-7 px-2 text-[0.68rem] opacity-0 group-hover:opacity-100"
                  onClick={() => makeCover(url)}
                >
                  Make cover
                </Button>
              )}
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute right-2 top-2 h-7 w-7"
                aria-label={`Remove photo ${index + 1}`}
                onClick={() => remove(url)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
          {pending.map((photo) => (
            <li key={photo.id} className="relative overflow-hidden rounded-lg border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.preview} alt="" className="aspect-[16/10] w-full object-cover opacity-70" />
              <span className="absolute inset-0 flex items-center justify-center bg-foreground/30">
                <Loader2 className="h-6 w-6 animate-spin text-card" />
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? <p className="text-[0.8rem] font-medium text-destructive">{error}</p> : null}
      {uploading ? (
        <p className="text-[0.8rem] text-muted-foreground">Uploading photos…</p>
      ) : null}
    </div>
  );
}
