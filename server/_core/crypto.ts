/**
 * AES-256-GCM symmetric encryption for reversible sensitive fields.
 * Key must be 32 bytes (256 bits) provided as hex string via FIELD_ENCRYPTION_KEY env var.
 * Format of encrypted output: base64(iv[12] + authTag[16] + ciphertext)
 */
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const raw = process.env.FIELD_ENCRYPTION_KEY;
  if (!raw) throw new Error("FIELD_ENCRYPTION_KEY env var is not set");
  const buf = Buffer.from(raw, "hex");
  if (buf.length !== 32)
    throw new Error("FIELD_ENCRYPTION_KEY must be exactly 32 bytes (64 hex chars)");
  return buf;
}

/**
 * Encrypts a plaintext string.
 * Returns a base64-encoded string: iv(12) + authTag(16) + ciphertext.
 * Max output length for a 20-char input ≈ 64 chars in base64 — fits in varchar(255).
 */
export function encryptField(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Layout: iv | authTag | ciphertext
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString("base64");
}

/**
 * Decrypts a base64-encoded string produced by encryptField.
 * Returns null if the value looks like a legacy bcrypt hash (starts with $2) or is invalid.
 */
export function decryptField(encoded: string): string | null {
  // Detect legacy bcrypt hash — cannot be decrypted
  if (encoded.startsWith("$2")) return null;
  try {
    const key = getKey();
    const combined = Buffer.from(encoded, "base64");
    if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) return null;
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}
