"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { withReturnTo } from "@/lib/return-to";
import { cn } from "@/lib/utils";

export function AuthShell({
  title,
  description,
  tab,
  returnTo,
  wide = false,
  children,
}: {
  title: string;
  description?: string;
  tab?: "sign-in" | "sign-up";
  returnTo?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="mx-auto flex w-full justify-center px-4 py-8 sm:px-6 sm:py-12">
      <Card className={cn("w-full", wide ? "max-w-lg" : "max-w-md")}>
        <CardHeader className="space-y-5">
          {tab ? (
            <Tabs
              value={tab}
              onValueChange={(value) => {
                const href = value === "sign-up" ? "/sign-up" : "/sign-in";
                router.push(withReturnTo(href, returnTo));
              }}
            >
              <TabsList className="grid h-11 w-full grid-cols-2">
                <TabsTrigger value="sign-in" className="h-9">
                  Sign in
                </TabsTrigger>
                <TabsTrigger value="sign-up" className="h-9">
                  Create account
                </TabsTrigger>
              </TabsList>
            </Tabs>
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
