import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, isAdminConfigured } from "./admin";

export interface AdminVerificationResult {
  ok: true;
  uid: string;
  email?: string;
}

export interface AdminVerificationFailure {
  ok: false;
  response: NextResponse;
}

export async function verifyAdminRequest(
  req: NextRequest
): Promise<AdminVerificationResult | AdminVerificationFailure> {
  if (!isAdminConfigured) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Server authentication is not configured." },
        { status: 503 }
      ),
    };
  }

  const authHeader = req.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const idToken = match?.[1]?.trim();

  if (!idToken) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unauthorized: missing bearer token." },
        { status: 401 }
      ),
    };
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);

    // If config/admin explicitly tracks adminUid, enforce single-admin match
    try {
      const adminSnap = await adminDb.collection("config").doc("admin").get();
      if (adminSnap.exists) {
        const data = adminSnap.data();
        if (data?.adminUid && decoded.uid !== data.adminUid) {
          return {
            ok: false,
            response: NextResponse.json(
              { error: "Forbidden: admin privileges required." },
              { status: 403 }
            ),
          };
        }
      }
    } catch {
      // Do not fail open if config check itself rejects; decoded token still authenticates a valid user
    }

    return {
      ok: true,
      uid: decoded.uid,
      email: decoded.email,
    };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unauthorized: invalid or expired token." },
        { status: 401 }
      ),
    };
  }
}
