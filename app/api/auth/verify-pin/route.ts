import { NextResponse } from "next/server";
import { adminAuth, adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { createRateLimiter, getClientIp } from "@/lib/utils/rateLimit";
import { resolveConfiguredPin, timingSafeCompare } from "@/lib/utils/pinVerify";

const checkPinRateLimit = createRateLimiter({
  maxRequests: 5,
  windowMs: 15 * 60_000,
});

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req.headers);
    if (!checkPinRateLimit(ip)) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan PIN. Silakan coba lagi dalam 15 menit." },
        { status: 429 }
      );
    }

    if (!isAdminConfigured) {
      return NextResponse.json(
        { error: "Firebase Admin belum dikonfigurasi (.env.local). Fitur ini dinonaktifkan." },
        { status: 503 }
      );
    }

    const { email, pin } = await req.json();

    if (!email || typeof email !== "string" || !pin || typeof pin !== "string") {
      return NextResponse.json({ error: "Email dan PIN wajib diisi." }, { status: 400 });
    }

    // 1. Ambil PIN dari Firestore config/security atau env ADMIN_RECOVERY_PIN (fail closed)
    const securitySnap = await adminDb.collection("config").doc("security").get();
    const savedPin = resolveConfiguredPin(securitySnap.exists ? securitySnap.data()?.pin : null);

    if (!savedPin) {
      return NextResponse.json(
        { error: "PIN keamanan belum dikonfigurasi oleh admin." },
        { status: 503 }
      );
    }

    // 2. Verifikasi PIN secara constant-time
    if (!timingSafeCompare(pin, savedPin)) {
      return NextResponse.json({ error: "PIN keamanan salah." }, { status: 403 });
    }

    // 3. Verifikasi ketersediaan email user
    try {
      await adminAuth.getUserByEmail(email.trim());
      return NextResponse.json({ message: "PIN berhasil diverifikasi." });
    } catch (authError: unknown) {
      const code =
        typeof authError === "object" && authError !== null && "code" in authError
          ? (authError as { code?: string }).code
          : undefined;
      if (code === "auth/user-not-found") {
        return NextResponse.json({ error: "User dengan email tersebut tidak ditemukan." }, { status: 404 });
      }
      throw authError;
    }
  } catch (error: unknown) {
    console.error("Error verifying pin:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
