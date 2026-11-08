import type { Metadata } from "next";
import { Providers } from "./providers";
import { CustomCursor } from "./components/CustomCursor";
import { SmoothScroll } from "./components/SmoothScroll";
import "./globals.css";

const siteUrl = "https://hannn.my.id";

export const metadata: Metadata = {
  title: {
    default: "Muhammad Farhan | Fullstack Web Developer Portfolio",
    template: "%s | Muhammad Farhan",
  },
  description:
    "Fullstack Web Developer & Software Engineer based in Indonesia, specializing in Next.js, React, Laravel, and PHP. Founder of HanDigital. Explore software projects, architecture case studies, and engineering services.",
  keywords: [
    "Muhammad Farhan",
    "Farhan",
    "mhdfrhan",
    "Fullstack Developer",
    "Web Developer Indonesia",
    "Fullstack Web Developer",
    "React Developer",
    "Next.js Developer",
    "Laravel Specialist",
    "HanDigital",
    "Software Engineer Pekanbaru",
    "Jasa Pembuatan Website",
    "Jasa Pembuatan Aplikasi Web",
    "SaaS Developer Indonesia",
    "Portfolio Web Developer",
  ],
  authors: [{ name: "Muhammad Farhan", url: "https://github.com/mhdfrhan" }],
  creator: "Muhammad Farhan",
  publisher: "Muhammad Farhan",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
    languages: {
      "id-ID": "/?lang=id",
      "en-US": "/?lang=en",
    },
  },
  openGraph: {
    title: "Muhammad Farhan | Fullstack Web Developer Portfolio",
    description:
      "Fullstack Web Developer specializing in Next.js, React, Laravel, and PHP. Explore projects, experiences, and HanDigital engineering services.",
    url: siteUrl,
    siteName: "Muhammad Farhan Portfolio",
    images: [
      {
        url: "/assets/og-image.png",
        width: 1200,
        height: 630,
        alt: "Muhammad Farhan — Fullstack Web Developer Portfolio",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Muhammad Farhan | Fullstack Web Developer Portfolio",
    description:
      "Fullstack Web Developer specializing in Next.js, React, Laravel, and PHP.",
    creator: "@mhdfrhan",
    images: ["/assets/og-image.png"],
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
    shortcut: "/favicon.ico",
    apple: "/assets/og-image.png",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${siteUrl}/#person`,
      name: "Muhammad Farhan",
      alternateName: ["Farhan", "mhdfrhan"],
      jobTitle: "Fullstack Web Developer & Software Engineer",
      description:
        "Fullstack Web Developer with 4+ years experience in building high-performance web applications, SaaS platforms, and enterprise ERP systems.",
      url: siteUrl,
      image: `${siteUrl}/assets/og-image.png`,
      email: "mailto:hi.mhdfarhan@gmail.com",
      telephone: "+6285121170403",
      sameAs: [
        "https://github.com/mhdfrhan",
        "https://www.linkedin.com/in/muhammad-farhan-79ba79294/",
        "https://instagram.com/mhdfarhan04",
        "https://wa.me/6285121170403",
      ],
      worksFor: {
        "@type": "Organization",
        "@id": "https://handigital.biz.id/#organization",
        name: "HanDigital",
        url: "https://handigital.biz.id",
        description:
          "Unit agensi jasa pembuatan software, web application, sistem informasi & desain UI/UX profesional.",
      },
      alumniOf: {
        "@type": "EducationalOrganization",
        name: "Universitas Muhammadiyah Riau",
      },
      knowsAbout: [
        "Web Development",
        "Next.js",
        "React.js",
        "Laravel",
        "PHP",
        "TypeScript",
        "JavaScript",
        "Tailwind CSS",
        "MySQL",
        "REST API",
        "Fullstack Architecture",
        "SaaS Development",
      ],
      address: {
        "@type": "PostalAddress",
        addressLocality: "Pekanbaru",
        addressRegion: "Riau",
        addressCountry: "ID",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "Muhammad Farhan — Fullstack Web Developer Portfolio",
      description:
        "Portofolio profesional Muhammad Farhan, Fullstack Web Developer spesialis React, Next.js, Laravel, dan PHP.",
      publisher: {
        "@id": `${siteUrl}/#person`,
      },
      inLanguage: ["id-ID", "en-US"],
    },
    {
      "@type": "ProfilePage",
      "@id": `${siteUrl}/#profilepage`,
      url: siteUrl,
      name: "Muhammad Farhan Portfolio",
      isPartOf: {
        "@id": `${siteUrl}/#website`,
      },
      mainEntity: {
        "@id": `${siteUrl}/#person`,
      },
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
