import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import AIChat from "./components/AIChat";
import TxCounter from "./components/TxCounter";
import NetworkGuard from "./components/NetworkGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Backr - Creator Platform on Arc Network",
  description: "Next Gen Creator Platform with Nanopayments on Arc",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo/rocket-favicon.svg" type="image/svg+xml" />
        <link rel="preload" as="image" href="/backgrounds/hero-bg-simple.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable}`}>
        <Providers>
          <NetworkGuard />
          {children}
          <AIChat />
          <TxCounter />
        </Providers>
      </body>
    </html>
  );
}
