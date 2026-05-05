import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { LangProvider } from "@/lib/i18n/provider";
import { getLang } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Cat Booth POS",
  description: "A POS for cat-product booth sellers. Apply to join the pilot.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const lang = await getLang();
  return (
    <html lang={lang} className="h-full antialiased">
      <body className="min-h-dvh flex flex-col font-sans text-text">
        <LangProvider lang={lang}>
          <ToastProvider>{children}</ToastProvider>
        </LangProvider>
      </body>
    </html>
  );
}
