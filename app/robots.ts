import type { MetadataRoute } from "next";

/**
 * robots.ts — Next.js Dynamic Robots Configuration
 * Fully optimized for both traditional search engines (Googlebot, Bingbot)
 * and 2026 Generative Engine Optimization (GEO) AI crawlers:
 * - GPTBot & ChatGPT-User (OpenAI / SearchGPT)
 * - ClaudeBot & Claude-Web (Anthropic)
 * - PerplexityBot (Perplexity AI)
 * - Google-Extended (Google Gemini & AI Overviews)
 * - Applebot-Extended (Apple Intelligence)
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://hannn.my.id";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/portfolio",
          "/assets/",
          "/img/",
          "/_next/static/",
          "/llms.txt",
          "/llms-full.txt",
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/api/admin",
          "/api/admin/*",
          "/api/chat",
        ],
      },
      {
        // Explicit allowance for AI citation and Generative Search engines
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-Web",
          "PerplexityBot",
          "Google-Extended",
          "Applebot-Extended",
          "cohere-ai",
          "Omgilibot",
        ],
        allow: [
          "/",
          "/portfolio",
          "/llms.txt",
          "/llms-full.txt",
          "/assets/",
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/api/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
