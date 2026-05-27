import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JANコード読み取り",
  description: "バーコードを読むと商品が出るアプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
