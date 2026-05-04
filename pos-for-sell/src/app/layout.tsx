import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cat Booth POS",
  description:
    "A POS for cat-product booth sellers. Apply to join the pilot.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-dvh flex flex-col font-sans text-text">
        {children}
      </body>
    </html>
  );
}
