import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Markdown 문서 만들기 | HTML·PDF·공유",
  description:
    "Markdown을 읽기 좋은 문서로 만들고 HTML, PDF, 공유 링크로 내보내세요. 문서는 브라우저에서만 처리됩니다.",
  keywords: ["Markdown 뷰어", "Markdown HTML 변환", "Markdown PDF", "Markdown 공유"],
  openGraph: {
    title: "Markdown을 읽기 좋은 문서로",
    description: "업로드 없이 HTML·PDF·공유 링크로 바로 내보내세요.",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary",
    title: "Markdown을 읽기 좋은 문서로",
    description: "브라우저에서 만들고 HTML·PDF·링크로 공유하세요.",
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
      <body className="flex min-h-full flex-col bg-white text-stone-800">{children}</body>
    </html>
  );
}
