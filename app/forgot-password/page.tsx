import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Button } from "@/components/ui/button";
import { safeReturnTo, withReturnTo } from "@/lib/return-to";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your CarsMW password.",
};

type ForgotPasswordPageProps = {
  searchParams: {
    returnTo?: string;
  };
};

export default function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const returnTo = safeReturnTo(searchParams.returnTo, "/account");

  return (
    <AuthShell
      title="Forgot password"
      description="Enter the email on your account and we’ll send a reset link."
    >
      <div className="space-y-6">
        <ForgotPasswordForm />
        <Button variant="ghost" className="w-full" asChild>
          <Link href={withReturnTo("/sign-in", returnTo)}>Back to sign in</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
