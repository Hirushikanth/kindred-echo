import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";

import "./globals.css";

const sans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Kindred Echo — Preserve Family Memories",
  description:
    "A private, consent-first AI memory room where families preserve stories in a loved one's voice. Always disclosed as AI recreation, never resurrection.",
  keywords: [
    "memory preservation",
    "family stories",
    "AI voice recreation",
    "grief support",
    "remembrance",
  ],
  openGraph: {
    title: "Kindred Echo — Preserve Family Memories",
    description:
      "A private AI memory room for preserving family stories in a loved one's voice.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF7F2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} bg-background`}>
      <body className="min-h-full font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
