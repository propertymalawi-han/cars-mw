import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { isGoogleAuthEnabled } from "@/lib/auth-env";
import type { AccountType, UserRole } from "@/types";

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  providers: isGoogleAuthEnabled()
    ? [
        Google({
          allowDangerousEmailAccountLinking: true,
        }),
      ]
    : [],
  callbacks: {
    authorized() {
      return true;
    },
    jwt({ token }) {
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === "string" ? token.id : (token.sub ?? "");
        session.user.accountType = (token.accountType as AccountType) ?? "individual";
        session.user.role = (token.role as UserRole) ?? "user";
        session.user.avatarUrl =
          (token.avatarUrl as string | null | undefined) ?? session.user.image ?? null;
        if (session.user.avatarUrl) {
          session.user.image = session.user.avatarUrl;
        }
        if (typeof token.name === "string") session.user.name = token.name;
        if (typeof token.email === "string") session.user.email = token.email;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
