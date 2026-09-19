"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { ExternalLink, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ADMIN_NAV_LINKS, isAdminNavActive } from "@/lib/admin-nav";
import type { StaffRole } from "@/types";

export function AdminShell({
  user,
  children,
}: {
  user: {
    name?: string | null;
    email?: string | null;
    role: StaffRole | string;
  };
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const email = user.email ?? user.name ?? "Staff";

  function handleSignOut() {
    void signOut({ redirectTo: "/" }).then(() => router.refresh());
  }

  return (
    <SidebarProvider className="admin-app min-h-svh">
      <Sidebar collapsible="icon" className="border-sidebar-border">
        <SidebarHeader className="border-b border-sidebar-border px-2 py-3">
          <Link
            href="/admin"
            className="flex items-center gap-2 overflow-hidden px-1"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-[4px] bg-copper text-[0.62rem] font-bold tracking-wide text-copper-foreground">
              MW
            </span>
            <span className="truncate text-sm font-extrabold tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              CarsMW
            </span>
          </Link>
          <p className="truncate px-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/55 group-data-[collapsible=icon]:hidden">
            Internal
          </p>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Operations</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {ADMIN_NAV_LINKS.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isAdminNavActive(pathname, item.href)}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border">
          <div className="group-data-[collapsible=icon]:hidden rounded-md bg-white/5 px-2.5 py-2">
            <p className="truncate text-[13px] font-medium text-sidebar-foreground">
              {email}
            </p>
            <Badge
              variant="outline"
              className="mt-1 border-white/20 px-1.5 py-0 text-[0.62rem] uppercase tracking-wide text-sidebar-foreground/80"
            >
              {user.role}
            </Badge>
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="View marketplace">
                <Link href="/">
                  <ExternalLink />
                  <span>View marketplace</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Sign out" onClick={handleSignOut}>
                <LogOut />
                <span>Sign out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-2 border-b bg-card px-3">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Admin
          </p>
        </header>
        <div className="flex-1 p-4 md:p-5">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
