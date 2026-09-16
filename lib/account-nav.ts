import {
  Bell,
  CarFront,
  Heart,
  History,
  MessageSquare,
  Star,
  User,
  type LucideIcon,
} from "lucide-react";

export type AccountNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const ACCOUNT_SELLING_LINKS: AccountNavItem[] = [
  { href: "/account/listings", label: "My listings", icon: CarFront },
];

export const ACCOUNT_ACTIVITY_LINKS: AccountNavItem[] = [
  { href: "/account/favourites", label: "Favourites", icon: Heart },
  { href: "/account/recent-activity", label: "Recent activity", icon: History },
  { href: "/account/enquiries", label: "Manage enquiries", icon: MessageSquare },
  { href: "/account/reviews", label: "Ratings & reviews", icon: Star },
];

export const ACCOUNT_SETTINGS_LINKS: AccountNavItem[] = [
  { href: "/account/profile", label: "Profile", icon: User },
  { href: "/account/notifications", label: "Notification settings", icon: Bell },
];

export const ACCOUNT_NAV_LINKS: AccountNavItem[] = [
  ...ACCOUNT_SELLING_LINKS,
  ...ACCOUNT_ACTIVITY_LINKS,
  ...ACCOUNT_SETTINGS_LINKS,
];

export function isAccountNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
