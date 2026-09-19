import type { DefaultSession } from "next-auth";
import type { AccountType, UserRole } from "@/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      accountType: AccountType;
      role: UserRole;
      avatarUrl: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    accountType?: AccountType;
    role?: UserRole;
    avatarUrl?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    accountType?: AccountType;
    role?: UserRole;
    avatarUrl?: string | null;
    roleCheckedAt?: number;
  }
}
