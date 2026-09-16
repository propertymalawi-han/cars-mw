import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { CarsMwPrismaAdapter } from "@/lib/auth-adapter";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { signInSchema } from "@/lib/validations/auth";

class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials";
}

class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
}

class UseGoogleError extends CredentialsSignin {
  code = "use_google";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: CarsMwPrismaAdapter(),
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
        const parsed = signInSchema.safeParse(credentials);
        if (!parsed.success) {
          throw new InvalidCredentialsError();
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user) {
          throw new InvalidCredentialsError();
        }

        if (!user.passwordHash) {
          throw new UseGoogleError();
        }

        const valid = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!valid) {
          throw new InvalidCredentialsError();
        }

        if (!user.emailVerified) {
          throw new EmailNotVerifiedError();
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatarUrl,
          accountType: user.accountType,
          role: user.role,
          avatarUrl: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      if (user?.id || trigger === "update") {
        const userId = user?.id ?? (typeof token.id === "string" ? token.id : token.sub);
        if (userId) {
          const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              accountType: true,
              role: true,
              avatarUrl: true,
              name: true,
              email: true,
            },
          });

          if (dbUser) {
            token.id = dbUser.id;
            token.accountType = dbUser.accountType;
            token.role = dbUser.role;
            token.avatarUrl = dbUser.avatarUrl;
            token.name = dbUser.name;
            token.email = dbUser.email;
          } else if (user?.id) {
            token.id = user.id;
            token.accountType = user.accountType;
            token.role = user.role;
            token.avatarUrl = user.avatarUrl ?? user.image ?? null;
          }
        }
      }

      return token;
    },
  },
});
