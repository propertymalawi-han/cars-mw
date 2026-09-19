import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { CarsMwPrismaAdapter } from "@/lib/auth-adapter";
import { isConfiguredAdminEmail } from "@/lib/auth-env";
import { prisma } from "@/lib/prisma";
import { createSupabaseAuthClient } from "@/lib/supabase/server";
import { isUserSuspended } from "@/lib/user-status";
import { signInSchema } from "@/lib/validations/auth";
import type { AccountType, UserRole } from "@/types";

const ROLE_REFRESH_MS = 30_000;

class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials";
}

class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
}

class AccountSuspendedError extends CredentialsSignin {
  code = "account_suspended";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: process.env.DATABASE_URL ? CarsMwPrismaAdapter() : undefined,
  session: { strategy: "jwt" },
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const parsed = signInSchema.safeParse(credentials);
          if (!parsed.success) {
            throw new InvalidCredentialsError();
          }

          const supabase = createSupabaseAuthClient();
          const { data, error } = await supabase.auth.signInWithPassword({
            email: parsed.data.email,
            password: parsed.data.password,
          });

          if (error || !data.user) {
            const message = error?.message?.toLowerCase() ?? "";
            if (
              error?.code === "email_not_confirmed" ||
              message.includes("email not confirmed")
            ) {
              throw new EmailNotVerifiedError();
            }
            throw new InvalidCredentialsError();
          }

          const { data: profile } = await supabase
            .from("users")
            .select("id, name, email, account_type, role, avatar_url")
            .eq("email", parsed.data.email)
            .maybeSingle();

          const accountType = (profile?.account_type ?? "individual") as AccountType;
          const role = (profile?.role ?? "user") as UserRole;
          const userId = profile?.id ?? data.user.id;

          if (await isUserSuspended(userId, parsed.data.email)) {
            throw new AccountSuspendedError();
          }

          return {
            id: userId,
            name: profile?.name ?? data.user.user_metadata?.name ?? data.user.email,
            email: profile?.email ?? data.user.email,
            image: profile?.avatar_url ?? data.user.user_metadata?.avatar_url,
            accountType,
            role,
            avatarUrl: profile?.avatar_url ?? null,
          };
        } catch (error) {
          if (error instanceof CredentialsSignin) {
            throw error;
          }
          console.error("Credentials sign-in failed", error);
          throw new InvalidCredentialsError();
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user }) {
      if (!user?.id && !user?.email) return true;
      if (await isUserSuspended(user.id, user.email)) {
        return "/sign-in?error=account_suspended";
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.accountType = user.accountType ?? "individual";
        token.role = user.role ?? "user";
        token.avatarUrl = user.avatarUrl ?? user.image ?? null;
        if (user.name) token.name = user.name;
        if (user.email) token.email = user.email;
        token.roleCheckedAt = 0;
      }

      const email = typeof token.email === "string" ? token.email : undefined;
      const lastChecked = typeof token.roleCheckedAt === "number" ? token.roleCheckedAt : 0;
      const shouldRefresh = Boolean(user?.id) || Date.now() - lastChecked > ROLE_REFRESH_MS;

      if (shouldRefresh && process.env.DATABASE_URL && (token.id || email)) {
        try {
          const dbUser = await prisma.user.findFirst({
            where:
              email && token.id
                ? { OR: [{ id: String(token.id) }, { email: email.toLowerCase() }] }
                : email
                  ? { email: email.toLowerCase() }
                  : { id: String(token.id) },
            select: {
              id: true,
              role: true,
              accountType: true,
              avatarUrl: true,
              name: true,
            },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.accountType = dbUser.accountType;
            token.avatarUrl = dbUser.avatarUrl ?? token.avatarUrl;
            if (dbUser.name) token.name = dbUser.name;
          }
          token.roleCheckedAt = Date.now();
        } catch (error) {
          console.error("Failed to load account role", error);
        }
      }

      if (isConfiguredAdminEmail(email)) {
        token.role = "admin";
      }

      return token;
    },
  },
});
