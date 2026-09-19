import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AccountMobileNav, AccountSidebar } from "@/components/account/account-nav";

export const metadata: Metadata = {
  title: "Account",
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-site px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-6 nav:flex-row nav:items-start nav:gap-10">
        <AccountSidebar />
        <div className="min-w-0 flex-1 space-y-6">
          <AccountMobileNav />
          {children}
        </div>
      </div>
    </div>
  );
}
