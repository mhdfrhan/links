import crypto from "crypto";

/**
 * Constant-time string comparison using SHA-256 digests so lengths never leak.
 */
export function timingSafeCompare(input: string, expected: string): boolean {
  const inputDigest = crypto.createHash("sha256").update(input, "utf8").digest();
  const expectedDigest = crypto.createHash("sha256").update(expected, "utf8").digest();
  return crypto.timingSafeEqual(inputDigest, expectedDigest);
}

/**
 * Resolves configured PIN from Firestore document data or env var without any hardcoded fallback.
 */
export function resolveConfiguredPin(
  firestorePin: unknown,
  envPin = process.env.ADMIN_RECOVERY_PIN
): string | null {
  const fromDoc = typeof firestorePin === "string" ? firestorePin.trim() : "";
  if (fromDoc) return fromDoc;

  const fromEnv = typeof envPin === "string" ? envPin.trim() : "";
  if (fromEnv) return fromEnv;

  return null;
}
