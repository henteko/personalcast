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
  title: "PersonalCast - AIが紡ぐあなたの一日",
  description: "日々の活動を分析し、AIパーソナリティがニュース番組形式でお届けする音声レポートサービス",
  openGraph: {
    title: "PersonalCast - AIが紡ぐあなたの一日",
    description: "日々の活動を分析し、AIパーソナリティがニュース番組形式でお届けする音声レポートサービス",
    images: ["https://personalcast.henteko07.com/ogp.jpg"],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PersonalCast - AIが紡ぐあなたの一日",
    description: "日々の活動を分析し、AIパーソナリティがニュース番組形式でお届けする音声レポートサービス",
    images: ["https://personalcast.henteko07.com/ogp.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
