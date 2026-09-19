import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new CarsMW password.",
};

type ResetPasswordPageProps = {
  searchParams: {
    token?: string;
    email?: string;
  };
};

export default function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const token = searchParams.token;
  const email = searchParams.email;

  if (!token || !email) {
    return (
      <AuthShell
        title="Reset link is missing"
        description="Use the link from your email, or request a new password reset."
      >
        <Button variant="copper" className="w-full" asChild>
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      description="This link expires one hour after it was sent."
    >
      <ResetPasswordForm email={email} token={token} />
    </AuthShell>
  );
}
