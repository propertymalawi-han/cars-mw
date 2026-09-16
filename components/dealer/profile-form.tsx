"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { dealerProfileSchema, type DealerProfileValues } from "@/lib/validations/dealer";
import { MALAWI_DISTRICTS } from "@/types";

export function DealerProfileForm({
  defaultValues,
  publicHref,
}: {
  defaultValues: DealerProfileValues;
  publicHref: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<DealerProfileValues>({
    resolver: zodResolver(dealerProfileSchema),
    defaultValues,
  });

  const logoUrl = form.watch("logoUrl");

  async function onSubmit(values: DealerProfileValues) {
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/dealer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(json.error ?? "Could not save dealership profile.");
      }
      router.refresh();
      setMessage("Dealership profile saved. Buyers will see this on your public page.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not save dealership profile.",
      );
    } finally {
      setPending(false);
    }
  }

  async function onLogoChange(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/uploads", { method: "POST", body });
      const json = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !json.url) {
        throw new Error(json.error ?? "Could not upload that logo.");
      }
      form.setValue("logoUrl", json.url, { shouldDirty: true });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Form {...form}>
      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
            {message}
          </p>
        ) : null}

        <div className="flex items-center gap-4">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className="size-16 rounded-md object-cover"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-md bg-muted text-lg font-semibold">
              {(form.getValues("name") || "D").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="logo">Dealership logo</Label>
            <Input
              id="logo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={uploading || pending}
              onChange={(event) => void onLogoChange(event.target.files?.[0])}
            />
            {uploading ? (
              <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" />
                Uploading…
              </p>
            ) : null}
          </div>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dealership name</FormLabel>
              <FormControl>
                <Input autoComplete="organization" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input type="tel" autoComplete="tel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="whatsapp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>WhatsApp</FormLabel>
                <FormControl>
                  <Input type="tel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={5}
                  placeholder="Tell buyers about the yard, stock, and how to visit."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="districts"
          render={() => (
            <FormItem>
              <FormLabel>Districts served</FormLabel>
              <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto rounded-md border p-3 sm:grid-cols-2">
                {MALAWI_DISTRICTS.map((district) => (
                  <FormField
                    key={district}
                    control={form.control}
                    name="districts"
                    render={({ field }) => {
                      const checked = field.value?.includes(district);
                      return (
                        <label className="flex min-h-11 items-center gap-2 text-sm">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) => {
                              const current = field.value ?? [];
                              field.onChange(
                                value
                                  ? [...current, district]
                                  : current.filter((item) => item !== district),
                              );
                            }}
                          />
                          {district}
                        </label>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="submit" variant="copper" disabled={pending || uploading}>
            {pending ? "Saving…" : "Save profile"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <a href={publicHref}>View public page</a>
          </Button>
        </div>
      </form>
    </Form>
  );
}
