import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "SplitSend — Split Courier Costs With Someone Nearby", template: "%s | SplitSend" },
  description: "Find someone in your city who also needs to send documents abroad. Share DHL, UPS, or FedEx courier costs. Save money on PEBC, WES, transcripts, and more.",
  keywords: ["split courier cost Nigeria", "DHL sharing Lagos", "PEBC documents Canada", "WES transcript sharing"],
  openGraph: {
    type: "website", locale: "en_NG",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "SplitSend",
    title: "SplitSend — Split Courier Costs With Someone Nearby",
    description: "Find someone in your city who also needs to send documents abroad. Share the courier cost.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body bg-white text-gray-900 antialiased">{children}</body>
    </html>
  );
}
