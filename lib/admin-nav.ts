import {
  CarFront,
  Database,
  LayoutDashboard,
  LineChart,
  ScrollText,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const ADMIN_NAV_LINKS: AdminNavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/listings", label: "Listings", icon: CarFront },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/vehicle-data", label: "Vehicle Data", icon: Database },
  { href: "/admin/analytics", label: "Analytics", icon: LineChart },
  { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
];

export function isAdminNavActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
