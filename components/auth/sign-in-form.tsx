"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AuthDivider } from "@/components/auth/auth-divider";
import { GoogleSignInButton } from "@/components/auth/google-button";
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
import { withReturnTo } from "@/lib/return-to";
import { signInSchema, type SignInValues } from "@/lib/validations/auth";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Email or password is incorrect.",
  CredentialsSignin: "Email or password is incorrect.",
  email_not_verified: "Verify your email before signing in. Check your inbox for a link.",
  use_google: "This account uses Google. Continue with Google instead.",
  OAuthAccountNotLinked: "This email is already used with another sign-in method.",
  AccessDenied: "Google sign-in was cancelled or denied.",
  Configuration: "Sign-in is not configured yet. Try email and password.",
  Verification: "That verification link is invalid or has expired.",
  Default: "Could not sign in. Try again.",
};

export function SignInForm({
  returnTo,
  googleEnabled,
  verified,
  error,
  reset,
}: {
  returnTo: string;
  googleEnabled: boolean;
  verified?: boolean;
  error?: string;
  reset?: boolean;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(
    error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default) : null,
  );
  const [pending, setPending] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const forgotHref = useMemo(
    () => withReturnTo("/forgot-password", returnTo),
    [returnTo],
  );

  async function onSubmit(values: SignInValues) {
    setFormError(null);
    setUnverifiedEmail(null);
    setPending(true);

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    setPending(false);

    if (!result || result.error) {
      const code = result?.code || result?.error || "Default";
      setFormError(ERROR_MESSAGES[code] ?? ERROR_MESSAGES.Default);
      if (code === "email_not_verified") {
        setUnverifiedEmail(values.email);
      }
      return;
    }

    router.push(returnTo);
    router.refresh();
  }

  async function resendVerification() {
    if (!unverifiedEmail) return;
    setResendState("sending");
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unverifiedEmail }),
      });
      setResendState("sent");
    } catch {
      setResendState("idle");
      setFormError("Could not resend the verification email.");
    }
  }

  return (
    <div className="space-y-6">
      {verified ? (
        <p className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          Email verified. You can sign in now.
        </p>
      ) : null}
      {reset ? (
        <p className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          Password updated. Sign in with your new password.
        </p>
      ) : null}
      {formError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      ) : null}
      {unverifiedEmail ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={resendState !== "idle"}
          onClick={() => void resendVerification()}
        >
          {resendState === "sent"
            ? "Verification email sent"
            : resendState === "sending"
              ? "Sending…"
              : "Resend verification email"}
        </Button>
      ) : null}

      {googleEnabled ? (
        <>
          <GoogleSignInButton returnTo={returnTo} />
          <AuthDivider />
        </>
      ) : null}

      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between gap-3">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href={forgotHref}
                    className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <Input type="password" autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" variant="copper" className="w-full" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
