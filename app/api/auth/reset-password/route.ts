import { NextResponse } from "next/server";
import { adminAuth, adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { createRateLimiter, getClientIp } from "@/lib/utils/rateLimit";
import { resolveConfiguredPin, timingSafeCompare } from "@/lib/utils/pinVerify";

const checkResetRateLimit = createRateLimiter({
  maxRequests: 5,
  windowMs: 15 * 60_000,
});

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req.headers);
    if (!checkResetRateLimit(ip)) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan reset. Silakan coba lagi dalam 15 menit." },
        { status: 429 }
      );
    }

    if (!isAdminConfigured) {
      return NextResponse.json(
        { error: "Firebase Admin belum dikonfigurasi (.env.local). Fitur ini dinonaktifkan." },
        { status: 503 }
      );
    }

    const { email, pin, newPassword } = await req.json();

    if (
      !email ||
      typeof email !== "string" ||
      !pin ||
      typeof pin !== "string" ||
      typeof newPassword !== "string"
    ) {
      return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password baru minimal 6 karakter." }, { status: 400 });
    }

    // 1. Ambil PIN dari Firestore config/security atau env ADMIN_RECOVERY_PIN (tanpa fallback hardcoded)
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

    // 3. Cari user berdasarkan email & perbarui password
    try {
      const userRecord = await adminAuth.getUserByEmail(email.trim());

      await adminAuth.updateUser(userRecord.uid, {
        password: newPassword,
      });

      return NextResponse.json({ message: "Password berhasil diperbarui." });
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
    console.error("Error resetting password:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
