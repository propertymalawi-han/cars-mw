import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Not authorized",
  robots: { index: false, follow: false },
};

export default async function ForbiddenPage() {
  const session = await auth();
  const signedIn = Boolean(session?.user);

  return (
    <div className="mx-auto flex w-full max-w-lg justify-center px-4 py-8 sm:px-6 sm:py-12">
      <div className="w-full space-y-4 rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium text-copper">403</p>
        <h1 className="text-[clamp(1.5rem,1.1rem+2vw,1.875rem)] font-semibold tracking-tight">
          Not authorized
        </h1>
        <p className="text-muted-foreground">
          {signedIn
            ? "Your account does not have access to this area."
            : "You do not have permission to view this page."}
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button asChild>
            <Link href="/">Back to home</Link>
          </Button>
          {signedIn ? (
            <Button asChild variant="outline">
              <Link href="/account">Go to account</Link>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
