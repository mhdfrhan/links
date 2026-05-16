import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Muhammad Farhan — Web Developer",
  description:
    "Fullstack web developer dengan 4 tahun pengalaman. Spesialisasi React, Next.js, Laravel, dan PHP.",
  keywords: [
    "web developer",
    "fullstack",
    "react",
    "next.js",
    "laravel",
    "portfolio",
    "Muhammad Farhan",
  ],
  authors: [{ name: "Muhammad Farhan" }],
  openGraph: {
    title: "Muhammad Farhan — Web Developer",
    description:
      "Fullstack web developer dengan 4 tahun pengalaman. Spesialisasi React, Next.js, Laravel, dan PHP.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} antialiased`}
        style={{ fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif" }}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
