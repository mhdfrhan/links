import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Semua Proyek & Portofolio Web Development",
  description:
    "Jelajahi seluruh arsip proyek website, aplikasi web SaaS, sistem informasi enterprise, dan integrasi payment gateway karya Muhammad Farhan (Laravel, Next.js, React, PHP, MySQL).",
  alternates: {
    canonical: "/portfolio",
  },
  openGraph: {
    title: "Semua Proyek & Portofolio — Muhammad Farhan",
    description:
      "Arsip lengkap proyek web application, sistem informasi, SaaS, dan solusi digital karya Muhammad Farhan.",
    url: "https://hannn.my.id/portfolio",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Semua Proyek & Portofolio — Muhammad Farhan",
    description:
      "Arsip lengkap proyek web application, sistem informasi, SaaS, dan solusi digital karya Muhammad Farhan.",
  },
};

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
