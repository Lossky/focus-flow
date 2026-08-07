import type { Metadata } from "next";
import { I18nProvider } from "@/contexts/i18n-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Focus Flow",
  description: "A focused task flow desktop app for macOS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
