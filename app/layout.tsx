import type { Metadata, Viewport } from "next";
import { Cause } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const cause = Cause({
  subsets: ["latin"],
  variable: "--font-primary",
  display: "swap",
});

const APP_NAME = "Flow Send";
const APP_DESCRIPTION =
  "Szybkie przesyłanie plików, zdjęć, linków i tekstu między urządzeniami. Bez konta, bez chmury, bez kabla.";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://flow-send.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${APP_NAME} — szybki transfer plików P2P`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
  icons: {
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    type: "website",
    locale: "pl_PL",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: APP_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#2B2B28",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className={cause.variable}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
