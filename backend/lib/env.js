import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envLocalPath = path.resolve(__dirname, "..", ".env.local");
const envPath = path.resolve(__dirname, "..", ".env");

// Load env files from backend folder:
dotenv.config({ path: envLocalPath });
dotenv.config({ path: envPath });

// --- Auto Setup Encryption & Migrate Plaintext Passwords ---
try {
  let usingPath = null;
  let envContent = "";
  
  if (fs.existsSync(envLocalPath)) {
    usingPath = envLocalPath;
    envContent = fs.readFileSync(envLocalPath, "utf8");
  } else if (fs.existsSync(envPath)) {
    usingPath = envPath;
    envContent = fs.readFileSync(envPath, "utf8");
  } else {
    // If neither exists, we will create .env
    usingPath = envPath;
    envContent = "";
  }

  let modified = false;
  
  // 1. Ensure ENCRYPTION_KEY exists and is valid
  let encryptionKey = process.env.ENCRYPTION_KEY;
  const hexPattern = /^[0-9a-fA-F]{64}$/;
  
  if (!encryptionKey || !hexPattern.test(encryptionKey)) {
    // Generate a cryptographically secure 32-byte hex key (64 hex characters)
    encryptionKey = crypto.randomBytes(32).toString("hex");
    process.env.ENCRYPTION_KEY = encryptionKey;
    
    const lines = envContent.split(/\r?\n/);
    let replaced = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith("ENCRYPTION_KEY=")) {
        lines[i] = `ENCRYPTION_KEY=${encryptionKey}`;
        replaced = true;
        break;
      }
    }
    if (!replaced) {
      if (envContent && !envContent.endsWith("\n")) {
        lines.push("");
      }
      lines.push("# Encryption key for securing secrets (32-byte hex)");
      lines.push(`ENCRYPTION_KEY=${encryptionKey}`);
    }
    envContent = lines.join("\n");
    modified = true;
    console.log("[Security Setup] Generated new 32-byte ENCRYPTION_KEY and saved to", path.basename(usingPath));
  }
  
  // Local encrypt helper to avoid circular imports during startup
  const localEncrypt = (text, keyHex) => {
    const key = Buffer.from(keyHex, "hex");
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const tag = cipher.getAuthTag().toString("hex");
    return `enc:${iv.toString("hex")}:${encrypted}:${tag}`;
  };
  
  // 2. Scan and encrypt ADMIN_SECRET and MASTER_SECRET if they are plaintext
  const encryptSecret = (keyName) => {
    const secretVal = process.env[keyName];
    if (secretVal && typeof secretVal === "string" && secretVal.trim() !== "" && !secretVal.startsWith("enc:")) {
      const trimmedVal = secretVal.trim();
      const encryptedVal = localEncrypt(trimmedVal, encryptionKey);
      
      // Update in process.env
      process.env[keyName] = encryptedVal;
      
      // Update in envContent
      const lines = envContent.split(/\r?\n/);
      let replaced = false;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith(`${keyName}=`)) {
          lines[i] = `${keyName}=${encryptedVal}`;
          replaced = true;
          break;
        }
      }
      if (!replaced) {
        lines.push(`${keyName}=${encryptedVal}`);
      }
      envContent = lines.join("\n");
      modified = true;
      console.log(`[Security Setup] Encrypted ${keyName} and updated env file`);
    }
  };
  
  encryptSecret("ADMIN_SECRET");
  encryptSecret("MASTER_SECRET");
  
  if (modified) {
    fs.writeFileSync(usingPath, envContent, "utf8");
  }
} catch (error) {
  console.error("[Security Setup Error]", error);
}
