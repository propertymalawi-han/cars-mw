"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/auth/google-icon";

export function GoogleSignInButton({
  returnTo,
  label = "Continue with Google",
}: {
  returnTo: string;
  label?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => {
        void signIn("google", { redirectTo: returnTo });
      }}
    >
      <GoogleIcon className="size-4" />
      {label}
    </Button>
  );
}
