import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { safeReturnTo } from "@/lib/return-to";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to CarsMW to manage your listings and dealer account.",
};

type SignInPageProps = {
  searchParams: {
    returnTo?: string;
    error?: string;
    verified?: string;
    reset?: string;
  };
};

export default function SignInPage({ searchParams }: SignInPageProps) {
  const returnTo = safeReturnTo(searchParams.returnTo, "/account");

  return (
    <AuthShell
      tab="sign-in"
      returnTo={returnTo}
      title="Sign in"
      description="Use your email and password, or continue with Google."
    >
      <SignInForm
        returnTo={returnTo}
        verified={searchParams.verified === "1"}
        reset={searchParams.reset === "1"}
        error={searchParams.error}
      />
    </AuthShell>
  );
}
