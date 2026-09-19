import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { safeReturnTo, withReturnTo } from "@/lib/return-to";

export const metadata: Metadata = {
  title: "Check your email",
};

type VerifyEmailSentPageProps = {
  searchParams: {
    email?: string;
    returnTo?: string;
  };
};

export default function VerifyEmailSentPage({ searchParams }: VerifyEmailSentPageProps) {
  const returnTo = safeReturnTo(searchParams.returnTo, "/account");

  return (
    <AuthShell
      title="Check your email"
      description="Confirm the link we sent to finish creating your account."
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {searchParams.email ? (
            <>
              We sent a verification link to{" "}
              <span className="font-medium text-foreground">{searchParams.email}</span>.
            </>
          ) : (
            <>We sent a verification link.</>
          )}{" "}
          Didn&apos;t get it? Check spam, or try signing in to resend the email.
        </p>
        <Button variant="copper" className="w-full" asChild>
          <Link href={withReturnTo("/sign-in", returnTo)}>Back to sign in</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
