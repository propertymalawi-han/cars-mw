import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
