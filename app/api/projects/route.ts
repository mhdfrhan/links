import { NextRequest, NextResponse } from "next/server";
import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { db as clientDb } from "@/lib/firebase/config";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { createRateLimiter, getClientIp } from "@/lib/utils/rateLimit";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
};

// ============================================================
// RATE LIMITER — Bounded in-memory, per IP, max 60 req/menit
// ============================================================
const checkRateLimit = createRateLimiter({
  maxRequests: 60,
  windowMs: 60_000,
});

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

async function getCategoriesAndProjects() {
  if (isAdminConfigured) {
    // 1. Gunakan Firebase Admin SDK (Standar untuk Node.js / Vercel Serverless)
    const [categoriesSnap, projectsSnap] = await Promise.all([
      adminDb.collection("categories").orderBy("order", "asc").get(),
      adminDb.collection("projects").orderBy("order", "asc").get(),
    ]);

    const categories = categoriesSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    const projects = projectsSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    return { categories, projects };
  }

  // 2. Fallback ke Firebase Client SDK (Jika service account tidak ada di env lokal)
  const [categoriesSnap, projectsSnap] = await Promise.all([
    getDocs(query(collection(clientDb, "categories"), orderBy("order", "asc"))),
    getDocs(query(collection(clientDb, "projects"), orderBy("order", "asc"))),
  ]);

  const categories = categoriesSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  const projects = projectsSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  return { categories, projects };
}

export async function GET(req: NextRequest) {
  try {
    // 1. IP Rate Limiting Security Check
    const ip = getClientIp(req.headers);
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: "Terlalu banyak permintaan (Rate limit exceeded). Coba lagi dalam 1 menit.",
        },
        {
          status: 429,
          headers: corsHeaders,
        }
      );
    }

    const { searchParams } = new URL(req.url);

    // 2. Optional API Key Security Check (jika diset di env PROJECTS_API_KEY atau HAN_DIGITAL_API_KEY)
    const requiredApiKey = process.env.PROJECTS_API_KEY || process.env.HAN_DIGITAL_API_KEY;
    if (requiredApiKey) {
      const authHeader = req.headers.get("authorization") || "";
      const bearerToken = authHeader.toLowerCase().startsWith("bearer ")
        ? authHeader.slice(7).trim()
        : null;
      const clientApiKey =
        req.headers.get("x-api-key")?.trim() ||
        bearerToken ||
        searchParams.get("api_key")?.trim();

      if (!clientApiKey || clientApiKey !== requiredApiKey) {
        return NextResponse.json(
          {
            success: false,
            error: "Unauthorized: API Key tidak valid atau tidak disertakan.",
          },
          {
            status: 401,
            headers: corsHeaders,
          }
        );
      }
    }

    const limitParam = searchParams.get("limit");
    const categoryParam = searchParams.get("category");

    // Fetch categories dan projects
    const { categories, projects } = await getCategoriesAndProjects();

    // Buat mapping kategori untuk mempermudah pencarian nama kategori & subkategori
    type CategoryDoc = { id: string; name?: string; subCategories?: { id: string; name: string }[] };
    const categoryMap = new Map<
      string,
      { name: string; subCategories?: { id: string; name: string }[] }
    >();
    (categories as CategoryDoc[]).forEach((cat) => {
      categoryMap.set(cat.id, {
        name: cat.name || "",
        subCategories: cat.subCategories || [],
      });
    });

    // Ambil dan filter hanya projek yang memiliki shareToApi === true
    let sharedProjects = (projects as Array<Record<string, unknown>>)
      .map((data) => {
        const categoryId = typeof data.categoryId === "string" ? data.categoryId : null;
        const subCategoryId = typeof data.subCategoryId === "string" ? data.subCategoryId : null;
        const catInfo = categoryId ? categoryMap.get(categoryId) : undefined;
        const subCatName = catInfo?.subCategories?.find(
          (s) => s.id === subCategoryId
        )?.name;

        return {
          id: String(data.id || ""),
          title: typeof data.title === "string" ? data.title : "",
          title_en: typeof data.title_en === "string" ? data.title_en : "",
          description: typeof data.description === "string" ? data.description : "",
          description_en: typeof data.description_en === "string" ? data.description_en : "",
          fullDescription: typeof data.fullDescription === "string" ? data.fullDescription : "",
          fullDescription_en: typeof data.fullDescription_en === "string" ? data.fullDescription_en : "",
          imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : "",
          techStack: Array.isArray(data.techStack) ? (data.techStack as string[]) : [],
          link: typeof data.link === "string" ? data.link : "",
          order: typeof data.order === "number" ? data.order : 0,
          categoryId,
          categoryName: catInfo?.name || null,
          subCategoryId,
          subCategoryName: subCatName || null,
          shareToApi: !!data.shareToApi,
        };
      })
      .filter((p) => p.shareToApi);

    // Filter opsional berdasarkan category ID atau category Name
    if (categoryParam) {
      sharedProjects = sharedProjects.filter(
        (p) =>
          p.categoryId === categoryParam ||
          p.categoryName?.toLowerCase() === categoryParam.toLowerCase()
      );
    }

    // Filter opsional limit
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        sharedProjects = sharedProjects.slice(0, parsedLimit);
      }
    }

    return NextResponse.json(
      {
        success: true,
        count: sharedProjects.length,
        data: sharedProjects,
      },
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: unknown) {
    console.error("[Projects API Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mengambil data projek",
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
