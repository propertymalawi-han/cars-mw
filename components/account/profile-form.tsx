"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
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
import { profileSchema, type ProfileValues } from "@/lib/validations/account";

export function ProfileForm({
  defaultValues,
  emailVerified,
}: {
  defaultValues: ProfileValues;
  emailVerified: boolean;
}) {
  const router = useRouter();
  const { update } = useSession();
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  const avatarUrl = form.watch("avatarUrl");

  async function onSubmit(values: ProfileValues) {
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = (await response.json()) as {
        error?: string;
        emailVerificationSent?: boolean;
      };
      if (!response.ok) {
        throw new Error(json.error ?? "Could not save profile.");
      }
      await update();
      router.refresh();
      setMessage(
        json.emailVerificationSent
          ? "Profile saved. Check your inbox to verify the new email."
          : "Profile saved.",
      );
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not save profile.");
    } finally {
      setPending(false);
    }
  }

  async function onAvatarChange(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/uploads", { method: "POST", body });
      const json = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !json.url) {
        throw new Error(json.error ?? "Could not upload that photo.");
      }
      form.setValue("avatarUrl", json.url, { shouldDirty: true });
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
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="size-16 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-full bg-muted text-lg font-semibold">
              {(form.getValues("name") || "U").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="avatar">Profile photo</Label>
            <Input
              id="avatar"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={uploading || pending}
              onChange={(event) => void onAvatarChange(event.target.files?.[0])}
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
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <p className="text-[0.8rem] text-muted-foreground">
                {emailVerified ? "Verified." : "Not verified yet."} Changing email sends a new verification link.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
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

        <Button type="submit" variant="copper" disabled={pending || uploading}>
          {pending ? "Saving…" : "Save profile"}
        </Button>
      </form>
    </Form>
  );
}
