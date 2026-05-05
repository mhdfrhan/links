import { NextResponse } from "next/server";
import { adminAuth, adminDb, isAdminConfigured } from "@/lib/firebase/admin";

export async function POST(req: Request) {
  try {
    if (!isAdminConfigured) {
      return NextResponse.json({ error: "Firebase Admin belum dikonfigurasi (.env.local). Fitur ini dinonaktifkan." }, { status: 500 });
    }

    const { email, pin } = await req.json();

    if (!email || !pin) {
      return NextResponse.json({ error: "Email dan PIN wajib diisi." }, { status: 400 });
    }

    // 1. Ambil PIN dari Firestore config/security
    const securityRef = adminDb.collection("config").doc("security");
    const securitySnap = await securityRef.get();
    
    let savedPin = "04032005"; // Default PIN

    if (securitySnap.exists) {
      savedPin = securitySnap.data()?.pin || "04032005";
    }

    // 2. Verifikasi PIN
    if (pin !== savedPin) {
      return NextResponse.json({ error: "PIN keamanan salah." }, { status: 403 });
    }

    // 3. Verifikasi ketersediaan email user
    try {
      await adminAuth.getUserByEmail(email);
      // Jika berhasil, berarti user ada dan PIN benar
      return NextResponse.json({ message: "PIN berhasil diverifikasi." });
    } catch (authError: any) {
      if (authError.code === "auth/user-not-found") {
        return NextResponse.json({ error: "User dengan email tersebut tidak ditemukan." }, { status: 404 });
      }
      throw authError;
    }

  } catch (error: any) {
    console.error("Error verifying pin:", error);
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server." }, { status: 500 });
  }
}
