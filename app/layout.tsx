import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const bigShoulders = Big_Shoulders({
  variable: "--font-big-shoulders",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "HEXA · Bolão Copa 2026",
  description: "Bolão da Copa do Mundo 2026 — palpites, ranking ao vivo e zebra valendo.",
  applicationName: "HEXA",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "HEXA · Bolão Copa 2026",
    description: "Entre no bolão. Acerte. Suba no ranking. Ao vivo.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A09",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${bigShoulders.variable} ${manrope.variable} ${jetbrains.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
