import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Markdown 책장 | 여러 MD를 한 권의 책처럼",
  description:
    "하나 이상의 Markdown 파일을 챕터로 구성해 브라우저에서 한 권의 책처럼 읽으세요.",
  keywords: ["Markdown 뷰어", "Markdown 책", "MD 리더", "Markdown 책장"],
  openGraph: {
    title: "Markdown을 한 권의 책처럼",
    description: "여러 MD 파일을 챕터로 묶어 브라우저에서 편안하게 읽으세요.",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary",
    title: "Markdown을 한 권의 책처럼",
    description: "여러 MD 파일을 챕터로 묶어 브라우저에서 편안하게 읽으세요.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-[#f5f0e7] text-[#292521]">{children}</body>
    </html>
  );
}
