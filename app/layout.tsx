import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "@fontsource-variable/syne";
import "./globals.css";
import "./glass.css";
import "./marketing.css";
import CookieBanner from "@/components/marketing/cookie-banner";

export const metadata: Metadata = {
  title: "Tivzo — Your events. In focus.",
  description:
    "Create events, welcome guests and manage every check-in with Tivzo.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
