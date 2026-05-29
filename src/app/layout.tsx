import type { Metadata } from "next";
import { cameraPlain, simpsonCW } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Campaign Universe — Burn Studio",
  description: "Visualize how a brand campaign extends across platforms.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cameraPlain.variable} ${simpsonCW.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-text">{children}</body>
    </html>
  );
}
