import crypto from "node:crypto";

/**
 * Helper to retrieve and validate the encryption key.
 * The key must be a 32-byte hex string (64 characters long).
 */
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not defined");
  }
  const hexPattern = /^[0-9a-fA-F]{64}$/;
  if (!hexPattern.test(key)) {
    throw new Error("ENCRYPTION_KEY must be a 32-byte hex string (64 characters long)");
  }
  return Buffer.from(key, "hex");
}

/**
 * Encrypts plain text using AES-256-GCM.
 * Returns a string formatted as "enc:<iv_hex>:<ciphertext_hex>:<tag_hex>".
 */
export function encrypt(text) {
  if (typeof text !== "string") {
    throw new Error("Text to encrypt must be a string");
  }
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // 12-byte IV for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const tag = cipher.getAuthTag().toString("hex");
  return `enc:${iv.toString("hex")}:${encrypted}:${tag}`;
}

/**
 * Decrypts a string formatted as "enc:<iv_hex>:<ciphertext_hex>:<tag_hex>".
 * If the input does not start with "enc:", returns it as-is (graceful fallback/migration).
 */
export function decrypt(encryptedText) {
  if (!encryptedText) return encryptedText;
  if (typeof encryptedText !== "string" || !encryptedText.startsWith("enc:")) {
    return encryptedText;
  }
  
  const parts = encryptedText.split(":");
  if (parts.length !== 4) {
    throw new Error("Invalid encrypted text format");
  }
  
  const [, ivHex, encryptedHex, tagHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}

/**
 * Checks if a value is encrypted.
 */
export function isEncrypted(value) {
  return typeof value === "string" && value.startsWith("enc:");
}
