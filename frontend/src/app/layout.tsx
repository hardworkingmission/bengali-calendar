import type { Metadata } from "next";
import { Geist, Noto_Sans_Bengali, Noto_Serif_Bengali } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-ui",
  subsets: ["latin"],
});

const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-bn",
  subsets: ["bengali"],
  weight: ["400", "500", "700"],
});

const notoSerifBengali = Noto_Serif_Bengali({
  variable: "--font-display",
  subsets: ["bengali"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "বাংলা পঞ্জিকা — Bangla Calendar",
  description:
    "Interactive Bangladesh-standard Bengali calendar with dual-date display, festival tracking, and personal notes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className={`${geistSans.variable} ${notoSansBengali.variable} ${notoSerifBengali.variable}`}>
      <body>{children}</body>
    </html>
  );
}
