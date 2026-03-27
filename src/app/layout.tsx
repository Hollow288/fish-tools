import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Fish Tools",
    template: "%s | Fish Tools",
  },
  description: "Fish Tools 是一个基于 Next.js 的轻量工具箱，包含 2FA 动态码和文本压一行等常用工具。",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
