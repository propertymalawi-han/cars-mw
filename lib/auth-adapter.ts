import type { Adapter, AdapterUser } from "next-auth/adapters";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { User } from "@prisma/client";
import { isConfiguredAdminEmail } from "@/lib/auth-env";
import { prisma } from "@/lib/prisma";

function toAdapterUser(user: User): AdapterUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.avatarUrl,
    accountType: user.accountType,
    role: user.role,
    avatarUrl: user.avatarUrl,
  } as AdapterUser;
}

export function CarsMwPrismaAdapter(): Adapter {
  const adapter = PrismaAdapter(prisma);

  return {
    ...adapter,
    async createUser(data) {
      const email = data.email.toLowerCase();
      const user = await prisma.user.create({
        data: {
          name: data.name?.trim() || email.split("@")[0] || "CarsMW user",
          email,
          emailVerified: data.emailVerified,
          avatarUrl: data.image,
          accountType: "individual",
          role: isConfiguredAdminEmail(email) ? "admin" : "user",
        },
      });
      return toAdapterUser(user);
    },
    async getUser(id) {
      const user = await prisma.user.findUnique({ where: { id } });
      return user ? toAdapterUser(user) : null;
    },
    async getUserByEmail(email) {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      return user ? toAdapterUser(user) : null;
    },
    async getUserByAccount({ provider, providerAccountId }) {
      const account = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: { provider, providerAccountId },
        },
        include: { user: true },
      });
      return account ? toAdapterUser(account.user) : null;
    },
    async updateUser(data) {
      const user = await prisma.user.update({
        where: { id: data.id },
        data: {
          ...(data.name != null ? { name: data.name } : {}),
          ...(data.email ? { email: data.email.toLowerCase() } : {}),
          ...(data.emailVerified !== undefined
            ? { emailVerified: data.emailVerified }
            : {}),
          ...(data.image !== undefined ? { avatarUrl: data.image } : {}),
        },
      });
      return toAdapterUser(user);
    },
  };
}
