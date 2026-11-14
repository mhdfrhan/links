import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { verifyAdminRequest } from "@/lib/firebase/serverAuth";

const ALLOWED_RESOURCE_TYPES = new Set(["image", "raw", "video"]);

/**
 * POST /api/cloudinary/delete
 * Body: { publicId: string, resourceType?: "image" | "raw" | "video" }
 *
 * Menghapus asset dari Cloudinary menggunakan signed request.
 * Wajib menyertakan Bearer ID Token admin Firebase yang valid.
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.ok) {
      return authResult.response;
    }

    const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim().replace(/^["']|["']$/g, "");
    const API_KEY = process.env.CLOUDINARY_API_KEY?.trim().replace(/^["']|["']$/g, "");
    const API_SECRET = process.env.CLOUDINARY_API_SECRET?.trim().replace(/^["']|["']$/g, "");

    if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
      console.error("[Cloudinary Delete] Missing credentials:", {
        hasCloudName: !!CLOUD_NAME,
        hasApiKey: !!API_KEY,
        hasApiSecret: !!API_SECRET,
      });
      return NextResponse.json(
        { error: "Cloudinary credentials tidak lengkap" },
        { status: 500 }
      );
    }

    if (API_KEY.length > 20 && /^[a-zA-Z0-9_-]+$/.test(API_KEY)) {
      console.warn("[Cloudinary Delete] WARNING: API_KEY looks like an API_SECRET. Please check your .env file.");
    }

    const { publicId, resourceType = "raw" } = await req.json();

    if (!publicId || typeof publicId !== "string") {
      return NextResponse.json(
        { error: "publicId diperlukan" },
        { status: 400 }
      );
    }

    if (!ALLOWED_RESOURCE_TYPES.has(resourceType)) {
      return NextResponse.json(
        { error: "resourceType tidak valid" },
        { status: 400 }
      );
    }

    // Buat signature untuk Cloudinary Signed API
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signatureString = `public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
    const signature = crypto
      .createHash("sha1")
      .update(signatureString)
      .digest("hex");

    const formData = new FormData();
    formData.append("public_id", publicId);
    formData.append("timestamp", timestamp);
    formData.append("api_key", API_KEY);
    formData.append("signature", signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/destroy`,
      {
        method: "POST",
        body: formData,
      }
    );

    const result = await response.json();

    if (result.result === "ok") {
      return NextResponse.json({ success: true, result: result.result });
    } else {
      return NextResponse.json(
        { error: "Cloudinary gagal menghapus file", detail: result },
        { status: 400 }
      );
    }
  } catch (err: unknown) {
    console.error("[Cloudinary Delete] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
