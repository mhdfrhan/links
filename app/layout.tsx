import type { Metadata } from "next";
import { Providers } from "./providers";
import { CustomCursor } from "./components/CustomCursor";
import { SmoothScroll } from "./components/SmoothScroll";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Muhammad Farhan | Web Developer Portfolio",
    template: "%s | Muhammad Farhan",
  },
  description:
    "Fullstack Web Developer specializing in React, Next.js, Laravel, and PHP. Explore my projects, experiences, and technical skills in modern web development.",
  keywords: [
    "Muhammad Farhan",
    "Web Developer",
    "Fullstack Developer",
    "Indonesia Web Developer",
    "React Developer",
    "Next.js Developer",
    "Laravel Specialist",
    "Software Engineer Portfolio",
  ],
  authors: [{ name: "Muhammad Farhan", url: "https://github.com/mhdfrhan" }],
  creator: "Muhammad Farhan",
  publisher: "Muhammad Farhan",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://mhdfarhan.vercel.app/"), // Ganti dengan domain asli nanti
  alternates: {
    canonical: "/",
    languages: {
      "id-ID": "/?lang=id",
      "en-US": "/?lang=en",
    },
  },
  openGraph: {
    title: "Muhammad Farhan | Web Developer Portfolio",
    description:
      "Fullstack Web Developer specializing in React, Next.js, Laravel, and PHP. Explore my projects and experiences.",
    url: "https://mhdfarhan.vercel.app/",
    siteName: "Muhammad Farhan Portfolio",
    images: [
      {
        url: "/og-image.jpg", // Pastikan file ini ada atau buat nanti
        width: 1200,
        height: 630,
        alt: "Muhammad Farhan Portfolio Preview",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Muhammad Farhan | Web Developer Portfolio",
    description:
      "Fullstack Web Developer specializing in React, Next.js, and Laravel.",
    creator: "@mhdfrhan", // Ganti dengan handle twitter asli jika ada
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="antialiased"
        style={{
          fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif",
        }}
        suppressHydrationWarning
      >
        <Providers>
          <SmoothScroll>
            <CustomCursor />
            {children}
          </SmoothScroll>
        </Providers>
      </body>
    </html>
  );
}
