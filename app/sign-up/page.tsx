import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { safeReturnTo } from "@/lib/return-to";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a CarsMW account as an individual or a dealer.",
};

type SignUpPageProps = {
  searchParams: {
    returnTo?: string;
  };
};

export default function SignUpPage({ searchParams }: SignUpPageProps) {
  const returnTo = safeReturnTo(searchParams.returnTo, "/account");
  const googleEnabled = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );

  return (
    <AuthShell
      tab="sign-up"
      returnTo={returnTo}
      wide
      title="Create an account"
      description="Join CarsMW to list cars, save your details, and manage a dealership."
    >
      <SignUpForm returnTo={returnTo} googleEnabled={googleEnabled} />
    </AuthShell>
  );
}
