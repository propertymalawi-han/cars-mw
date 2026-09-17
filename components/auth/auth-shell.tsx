"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { withReturnTo } from "@/lib/return-to";
import { cn } from "@/lib/utils";

export function AuthShell({
  title,
  description,
  tab,
  returnTo,
  signInHref,
  signUpHref,
  wide = false,
  embedded = false,
  children,
}: {
  title: string;
  description?: string;
  tab?: "sign-in" | "sign-up";
  returnTo?: string;
  signInHref?: string;
  signUpHref?: string;
  wide?: boolean;
  embedded?: boolean;
  children: React.ReactNode;
}) {
  const signInLink = signInHref ?? withReturnTo("/sign-in", returnTo);
  const signUpLink = signUpHref ?? withReturnTo("/sign-up", returnTo);

  return (
    <div
      className={cn(
        "mx-auto flex w-full justify-center",
        embedded ? "px-0 py-0" : "px-4 py-8 sm:px-6 sm:py-12",
      )}
    >
      <Card className={cn("w-full", wide ? "max-w-lg" : "max-w-md")}>
        <CardHeader className="space-y-5">
          {tab ? (
            <nav className="grid h-11 w-full grid-cols-2 rounded-lg bg-muted p-1 text-muted-foreground">
              <Link
                href={signInLink}
                className={cn(
                  "inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-all",
                  tab === "sign-in"
                    ? "bg-background text-foreground shadow"
                    : "hover:text-foreground",
                )}
              >
                Sign in
              </Link>
              <Link
                href={signUpLink}
                className={cn(
                  "inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-all",
                  tab === "sign-up"
                    ? "bg-background text-foreground shadow"
                    : "hover:text-foreground",
                )}
              >
                Create account
              </Link>
            </nav>
          ) : null}
          <div className="space-y-1.5">
            <CardTitle className="text-[clamp(1.35rem,1.1rem+1.2vw,1.75rem)] font-bold tracking-tight text-foreground">
              {title}
            </CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}
