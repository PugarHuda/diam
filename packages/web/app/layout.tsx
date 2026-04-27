import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Diam — Confidential OTC Desk on Nox",
  description:
    "Institutional-grade dark pool. On-chain OTC with hidden amounts and Vickrey-fair RFQ pricing, built on iExec Nox.",
  openGraph: {
    title: "Diam",
    description: "Your trade. Their guess. Nobody knows.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${spaceGrotesk.variable}`}
    >
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
        {/* Global scanline overlay */}
        <div className="pointer-events-none fixed inset-0 z-[60] scanline opacity-30" />
      </body>
    </html>
  );
}
