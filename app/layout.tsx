import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthSessionProvider } from "@/components/auth/session-provider";
import { RouteLoadingBar } from "@/components/route-loading-bar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CarsMW — Buy and sell cars in Malawi",
    template: "%s | CarsMW",
  },
  description:
    "Buy and sell cars in Malawi. Browse listings in Lilongwe, Blantyre, Mzuzu, and beyond — priced in Malawian Kwacha.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-MW">
      <body className={`${inter.variable} min-h-screen bg-background font-sans antialiased`}>
        <AuthSessionProvider>
          <div className="flex min-h-screen flex-col">
            <RouteLoadingBar />
            <SiteHeader />
            <main className="min-w-0 flex-1">{children}</main>
            <SiteFooter />
          </div>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
