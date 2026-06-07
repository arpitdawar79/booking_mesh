import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "The Stream by Ekantah — Email Dashboard",
  description:
    "Booking confirmation, cancellation, notification & thank-you email system for The Stream by Ekantah.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <body
        className={`${inter.className} min-h-screen bg-background text-foreground overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
