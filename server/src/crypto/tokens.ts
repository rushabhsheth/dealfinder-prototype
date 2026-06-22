import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { config } from "../config.js";

/**
 * Symmetric encryption for OAuth tokens (and any other secret-at-rest the server
 * must store). Algorithm: AES-256-GCM (authenticated encryption).
 *
 * Why GCM: it provides confidentiality AND integrity — a tampered ciphertext
 * fails to decrypt rather than silently returning garbage. The 16-byte auth tag
 * is stored alongside the ciphertext.
 *
 * Key: 32 bytes from config.tokenEncryptionKey (env TOKEN_ENCRYPTION_KEY,
 * base64). The key never touches the database. Rotating it requires
 * re-encrypting stored values (see docs/OAUTH_TOKEN_STORAGE.md).
 *
 * Serialized format written to the DB (single text column):
 *   v1.<iv_b64>.<authTag_b64>.<ciphertext_b64>
 * The "v1" prefix lets us evolve the scheme / rotate keys later without guessing.
 */

const ALGO = "aes-256-gcm";
const IV_BYTES = 12; // 96-bit nonce: the recommended size for GCM
const VERSION = "v1";

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, config.tokenEncryptionKey, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(".");
}

export function decryptSecret(serialized: string): string {
  const parts = serialized.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error("Malformed or unsupported ciphertext envelope");
  }
  const [, ivB64, tagB64, dataB64] = parts;
  const iv = Buffer.from(ivB64!, "base64");
  const authTag = Buffer.from(tagB64!, "base64");
  const ciphertext = Buffer.from(dataB64!, "base64");

  const decipher = createDecipheriv(ALGO, config.tokenEncryptionKey, iv);
  decipher.setAuthTag(authTag);
  // .final() throws if the auth tag doesn't match — i.e. tampering or wrong key.
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}

/** Constant-time compare for opaque tokens/secrets (e.g. OAuth `state`). */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
