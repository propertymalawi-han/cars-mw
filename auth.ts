import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { CarsMwPrismaAdapter } from "@/lib/auth-adapter";
import { createSupabaseAuthClient } from "@/lib/supabase/server";
import { signInSchema } from "@/lib/validations/auth";
import type { AccountType, UserRole } from "@/types";

class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials";
}

class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
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

          return {
            id: profile?.id ?? data.user.id,
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
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.accountType = user.accountType ?? "individual";
        token.role = user.role ?? "user";
        token.avatarUrl = user.avatarUrl ?? user.image ?? null;
        if (user.name) token.name = user.name;
        if (user.email) token.email = user.email;
      }

      return token;
    },
  },
});
