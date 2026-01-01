import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YouTube Rater - Is This Video Worth Your Time?",
  description: "Analyze any YouTube video before you watch. Detect clickbait, gatekeeping, and predatory content.",
  keywords: ["youtube", "video analysis", "clickbait detector", "scam protection", "video rating"],
  openGraph: {
    title: "YouTube Rater - Is This Video Worth Your Time?",
    description: "Analyze any YouTube video before you watch. Detect clickbait, gatekeeping, and predatory content.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
