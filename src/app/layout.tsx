import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Starfall Survivors — 2D Cosmic Arcade Survivor Game",
  description: "A fast-paced neon cosmic arcade survivor game. Dodge, level up, evolve weapons, defeat bosses, and climb global leaderboards. Instant play on desktop & mobile.",
  keywords: ["arcade", "survivor game", "browser game", "phaser 3", "cosmic survivor", "action roguelike"],
  authors: [{ name: "Starfall Survivors Team" }],
  openGraph: {
    title: "Starfall Survivors",
    description: "Instant play 2D cosmic survivor arcade in the browser.",
    url: "https://starfall-survivors.vercel.app",
    siteName: "Starfall Survivors",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "Starfall Survivors Cosmic Arena",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Starfall Survivors",
    description: "Instant play 2D cosmic survivor arcade in the browser.",
    images: ["/api/og"],
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#070814",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-cosmic-dark select-none">
      <body className="antialiased min-h-screen bg-cosmic-dark text-white overflow-hidden">
        {children}
      </body>
    </html>
  );
}
