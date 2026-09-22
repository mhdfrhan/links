import { NextRequest, NextResponse } from "next/server";
import * as adminModule from "firebase-admin";
import { db as clientDb } from "@/lib/firebase/config";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
};

// ============================================================
// RATE LIMITER — In-memory, per IP, max 60 req/menit
// ============================================================
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (record.count >= 60) return false;

  record.count++;
  return true;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

function getAdminFirestore() {
  if (!adminModule.apps.length) {
    const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountStr) {
      try {
        const serviceAccount = JSON.parse(serviceAccountStr);
        adminModule.initializeApp({
          credential: adminModule.credential.cert(serviceAccount),
        });
      } catch (err) {
        console.error("[Projects API] Error initializing Firebase Admin:", err);
      }
    }
  }
  return adminModule.apps.length ? adminModule.firestore() : null;
}

async function getCategoriesAndProjects() {
  const adminDb = getAdminFirestore();

  if (adminDb) {
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
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
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
    const categoryMap = new Map<
      string,
      { name: string; subCategories?: { id: string; name: string }[] }
    >();
    categories.forEach((cat: any) => {
      categoryMap.set(cat.id, {
        name: cat.name || "",
        subCategories: cat.subCategories || [],
      });
    });

    // Ambil dan filter hanya projek yang memiliki shareToApi === true
    let sharedProjects = projects
      .map((data: any) => {
        const catInfo = data.categoryId ? categoryMap.get(data.categoryId) : undefined;
        const subCatName = catInfo?.subCategories?.find(
          (s: any) => s.id === data.subCategoryId
        )?.name;

        return {
          id: data.id,
          title: data.title || "",
          title_en: data.title_en || "",
          description: data.description || "",
          description_en: data.description_en || "",
          fullDescription: data.fullDescription || "",
          fullDescription_en: data.fullDescription_en || "",
          imageUrl: data.imageUrl || "",
          cloudinaryPublicId: data.cloudinaryPublicId || "",
          techStack: Array.isArray(data.techStack) ? data.techStack : [],
          link: data.link || "",
          order: typeof data.order === "number" ? data.order : 0,
          categoryId: data.categoryId || null,
          categoryName: catInfo?.name || null,
          subCategoryId: data.subCategoryId || null,
          subCategoryName: subCatName || null,
          shareToApi: !!data.shareToApi,
        };
      })
      .filter((p: any) => p.shareToApi);

    // Filter opsional berdasarkan category ID atau category Name
    if (categoryParam) {
      sharedProjects = sharedProjects.filter(
        (p: any) =>
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
  } catch (error: any) {
    console.error("[Projects API Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal mengambil data projek",
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
