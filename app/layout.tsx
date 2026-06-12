import { PWAShell } from "@/components/pwa/pwa-shell";
import { getThemeCssVariablesString } from "@/lib/theme-config";
import { ThemeProvider } from "@/lib/theme-context";
import type { Metadata, Viewport } from "next";
import { ViewTransitions } from "next-view-transitions";
import { Outfit, Plus_Jakarta_Sans, Space_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: ["400", "700"],
});

const APP_NAME = "The Stream by Ekantah";
const APP_TITLE = "The Stream Dashboard";
const APP_DESCRIPTION =
  "Booking, guest, revenue, email, salary, and WhatsApp dashboard for The Stream by Ekantah.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_TITLE,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "The Stream",
    startupImage: [
      {
        url: "/apple-touch-icon.png",
        media: "(device-width: 430px) and (device-height: 932px)",
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon/faviconldpi.png", sizes: "36x36", type: "image/png" },
      { url: "/favicon/faviconmdpi.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon/faviconxhdpi.png", sizes: "96x96", type: "image/png" },
      {
        url: "/favicon/faviconxxhdpi.png",
        sizes: "144x144",
        type: "image/png",
      },
      {
        url: "/favicon/faviconxxxhdpi.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
    apple: [
      { url: "/favicon/favicon@6x.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: APP_TITLE,
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: APP_TITLE,
    description: APP_DESCRIPTION,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": "The Stream",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
  ],
};

const themeInitScript = `
  (function() {
    try {
      var theme = localStorage.getItem('theme');
      if (theme === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      } else {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        document.documentElement.style.colorScheme = 'dark';
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="/" />
        <link rel="dns-prefetch" href="/" />
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <style
          dangerouslySetInnerHTML={{ __html: getThemeCssVariablesString() }}
        />
      </head>
      <body
        className={`${outfit.variable} ${plusJakartaSans.variable} ${spaceMono.variable} font-sans min-h-screen bg-background text-foreground overflow-x-hidden`}
      >
        <ViewTransitions>
          <ThemeProvider>
            <PWAShell>{children}</PWAShell>
          </ThemeProvider>
        </ViewTransitions>
      </body>
    </html>
  );
}
