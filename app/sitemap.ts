import type { MetadataRoute } from "next";

/**
 * sitemap.ts — Next.js Dynamic XML Sitemap
 * Automatically serves https://hannn.my.id/sitemap.xml
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://hannn.my.id";
  const now = new Date();

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
      images: [`${baseUrl}/assets/og-image.png`],
    },
    {
      url: `${baseUrl}/portfolio`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
  ];
}
