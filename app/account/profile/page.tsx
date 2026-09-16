import type { Metadata } from "next";
import { PasswordForm } from "@/components/account/password-form";
import { ProfileForm } from "@/components/account/profile-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Profile",
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const sessionUser = await requirePageUser("/account/profile");
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: { dealer: true },
  });

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[clamp(1.5rem,1.1rem+2vw,1.875rem)] font-semibold tracking-tight">
            Profile
          </h1>
          <Badge variant="outline">
            {user.accountType === "dealer" ? "Dealer" : "Individual"}
          </Badge>
          {user.emailVerified ? (
            <Badge variant="success">Email verified</Badge>
          ) : (
            <Badge variant="secondary">Email not verified</Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          Update your name, contact details, photo, and password.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal details</CardTitle>
          <CardDescription>
            {user.dealer ? `Dealership: ${user.dealer.name}` : "Shown to sellers when you send an enquiry."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            emailVerified={Boolean(user.emailVerified)}
            defaultValues={{
              name: user.name,
              email: user.email,
              phone: user.phone ?? "",
              avatarUrl: user.avatarUrl,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            {user.passwordHash
              ? "Choose a new password for email sign-in."
              : "Add a password if you also want to sign in without Google."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm hasPassword={Boolean(user.passwordHash)} />
        </CardContent>
      </Card>
    </div>
  );
}
