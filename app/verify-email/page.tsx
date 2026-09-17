import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { verifyEmailToken } from "@/lib/email-verification";

export const metadata: Metadata = {
  title: "Verify email",
};

type VerifyEmailPageProps = {
  searchParams: {
    token?: string;
    email?: string;
    token_hash?: string;
    type?: string;
    code?: string;
  };
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  if (searchParams.token_hash || searchParams.code) {
    const params = new URLSearchParams();
    if (searchParams.code) params.set("code", searchParams.code);
    if (searchParams.token_hash) params.set("token_hash", searchParams.token_hash);
    if (searchParams.type) params.set("type", searchParams.type);
    redirect(`/auth/callback?${params.toString()}`);
  }

  const token = searchParams.token;
  const email = searchParams.email;

  if (!token || !email) {
    return (
      <VerifyMessage
        title="Verification link is missing"
        body="Use the link from your email, or request a new verification email from the sign-in page."
      />
    );
  }

  let result: { ok: true } | { ok: false; reason: string };
  try {
    result = await verifyEmailToken(email, token);
  } catch (error) {
    console.error("Failed to verify email token", error);
    return (
      <VerifyMessage
        title="Could not verify email"
        body="Use the latest link from your inbox, or request a new verification email from the sign-in page."
      />
    );
  }

  if (result.ok) {
    redirect("/sign-in?verified=1");
  }

  return (
    <VerifyMessage
      title={result.reason === "expired" ? "Link expired" : "Could not verify email"}
      body={
        result.reason === "expired"
          ? "That verification link has expired. Sign in and resend a new one."
          : "That verification link is invalid. Request a new email from the sign-in page."
      }
    />
  );
}

function VerifyMessage({ title, body }: { title: string; body: string }) {
  return (
    <AuthShell title={title} description={body}>
      <Button variant="copper" className="w-full" asChild>
        <Link href="/sign-in">Back to sign in</Link>
      </Button>
    </AuthShell>
  );
}
