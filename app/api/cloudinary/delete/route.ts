import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const API_KEY = process.env.CLOUDINARY_API_KEY!;
const API_SECRET = process.env.CLOUDINARY_API_SECRET!;

/**
 * POST /api/cloudinary/delete
 * Body: { publicId: string, resourceType?: "image" | "raw" }
 *
 * Menghapus asset dari Cloudinary menggunakan signed request.
 * Endpoint ini hanya bisa diakses server-side (API Secret tidak pernah ke client).
 */
export async function POST(req: NextRequest) {
  try {
    const { publicId, resourceType = "raw" } = await req.json();

    if (!publicId) {
      return NextResponse.json(
        { error: "publicId diperlukan" },
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

    // Kirim request ke Cloudinary Destroy API
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
  } catch (err: any) {
    console.error("[Cloudinary Delete] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", detail: err.message },
      { status: 500 }
    );
  }
}
