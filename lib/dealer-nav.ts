import {
  CarFront,
  LayoutDashboard,
  MessageSquare,
  Store,
  type LucideIcon,
} from "lucide-react";

export type DealerNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const DEALER_NAV_LINKS: DealerNavItem[] = [
  { href: "/dealer/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dealer/dashboard/listings", label: "My listings", icon: CarFront },
  { href: "/dealer/dashboard/enquiries", label: "Enquiries", icon: MessageSquare },
  { href: "/dealer/dashboard/profile", label: "Profile", icon: Store },
];

export function isDealerNavActive(pathname: string, href: string) {
  if (href === "/dealer/dashboard") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
