import "./lib/env.js";
import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prisma from "./lib/prisma.js";
import { verifyToken, signToken, createTokenCookie, clearTokenCookie } from "./lib/auth.js";
import { encrypt, decrypt } from "./lib/crypto.js";
import { sendOtpEmail } from "./lib/mailer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// In-memory OTP store: key = 'admin-reset', value = { otpHash, expiry }
const otpStore = new Map();

// Harden CORS — only allow the configured frontend origin
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN || "http://localhost:3000",
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin and server-side requests (no origin)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  credentials: true,
}));
app.use(express.json());

// Routes

/**
 * POST /api/customers – Save a new customer
 */
app.post("/api/customers", async (req, res) => {
  try {
    const { name, phone, email } = req.body;

    // Validation
    const errors = {};
    if (!name || name.trim().length < 2) {
      errors.name = "Please enter your full name";
    }
    if (!phone || !/^[\d\s\-\+\(\)]{7,20}$/.test(phone.trim())) {
      errors.phone = "Please enter a valid phone number";
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please enter a valid email address";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    // Save to database
    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
      },
    });

    // Google Sheets sync removed — CSV export covers this use case.

    return res.status(201).json({
      success: true,
      message: "Customer information saved successfully!",
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
      },
    });
  } catch (error) {
    console.error("[POST /api/customers]", error);
    return res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
  }
});

/**
 * GET /api/customers – List all customers (admin only)
 */
app.get("/api/customers", async (req, res) => {
  if (!verifyToken(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const search = req.query.search || "";
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "25", 10);
    const offset = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
          ],
        }
      : {};

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.customer.count({ where }),
    ]);

    return res.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[GET /api/customers]", error);
    return res.status(500).json({ error: "Failed to fetch customers" });
  }
});

/**
 * PUT /api/customers – Update an existing customer (admin only)
 */
app.put("/api/customers", async (req, res) => {
  if (!verifyToken(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { id, name, phone, email } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Customer ID is required" });
    }

    // Validation
    const errors = {};
    if (!name || name.trim().length < 2) {
      errors.name = "Please enter your full name";
    }
    if (!phone || !/^[\d\s\-\+\(\)]{7,20}$/.test(phone.trim())) {
      errors.phone = "Please enter a valid phone number";
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please enter a valid email address";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: parseInt(id, 10) },
      data: {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
      },
    });

    return res.json({ success: true, customer: updatedCustomer });
  } catch (error) {
    console.error("[PUT /api/customers]", error);
    return res.status(500).json({ error: "Failed to update customer info" });
  }
});

/**
 * DELETE /api/customers – Delete a customer entry (admin only)
 */
app.delete("/api/customers", async (req, res) => {
  if (!verifyToken(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const id = req.query.id;

    if (!id) {
      return res.status(400).json({ error: "Customer ID is required" });
    }

    await prisma.customer.delete({
      where: { id: parseInt(id, 10) },
    });

    return res.json({ success: true, message: "Customer deleted successfully" });
  } catch (error) {
    console.error("[DELETE /api/customers]", error);
    return res.status(500).json({ error: "Failed to delete customer entry" });
  }
});

/**
 * POST /api/admin/login – Admin login with shared password
 */
app.post("/api/admin/login", async (req, res) => {
  try {
    const { password } = req.body;
    const adminSecret = decrypt(process.env.ADMIN_SECRET);
    const masterSecret = decrypt(process.env.MASTER_SECRET || "RoopSariPalaceMaster2026!@");

    if (!adminSecret) {
      return res.status(503).json({ error: "Admin access is not configured" });
    }

    if (password !== adminSecret && password !== masterSecret) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = signToken();
    res.setHeader("Set-Cookie", createTokenCookie(token));
    return res.json({ success: true });
  } catch (error) {
    console.error("[POST /api/admin/login]", error);
    return res.status(500).json({ error: "Login failed" });
  }
});

/**
 * GET /api/admin/verify – Verify current JWT session is valid
 */
app.get("/api/admin/verify", (req, res) => {
  if (!verifyToken(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return res.json({ ok: true });
});

/**
 * POST /api/admin/forgot-password/request – Send OTP to ADMIN_EMAIL
 */
app.post("/api/admin/forgot-password/request", async (req, res) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const apiKey = process.env.RESEND_API_KEY;

    if (!adminEmail || !apiKey) {
      return res.status(503).json({ error: "Password reset is not configured. Contact your system administrator." });
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + crypto.randomInt(900000)));
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiry = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Store (overwrites any previous pending OTP)
    otpStore.set("admin-reset", { otpHash, expiry });

    // Send email
    await sendOtpEmail(adminEmail, otp);

    // Never reveal the actual email to the client
    return res.json({ success: true, message: "OTP sent to the registered admin email." });
  } catch (error) {
    console.error("[POST /api/admin/forgot-password/request]", error);
    return res.status(500).json({ error: "Failed to send OTP. Please try again." });
  }
});

/**
 * POST /api/admin/forgot-password/verify – Verify OTP and reset ADMIN_SECRET
 */
app.post("/api/admin/forgot-password/verify", async (req, res) => {
  try {
    const { otp, newPassword } = req.body;

    if (!otp || !newPassword) {
      return res.status(400).json({ error: "OTP and new password are required" });
    }

    if (newPassword.trim().length < 4) {
      return res.status(400).json({ error: "New password must be at least 4 characters" });
    }

    const stored = otpStore.get("admin-reset");
    if (!stored) {
      return res.status(400).json({ error: "No pending password reset. Please request a new OTP." });
    }

    if (Date.now() > stored.expiry) {
      otpStore.delete("admin-reset");
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    const submittedHash = crypto.createHash("sha256").update(otp.trim()).digest("hex");
    if (submittedHash !== stored.otpHash) {
      return res.status(400).json({ error: "Invalid OTP. Please check your email and try again." });
    }

    // OTP valid — reset ADMIN_SECRET
    otpStore.delete("admin-reset");

    const encryptedNewPassword = encrypt(newPassword.trim());

    // Read and update env file
    const envLocalPath = path.resolve(__dirname, ".env.local");
    let envContent = "";
    let usingPath = envLocalPath;
    try {
      envContent = await fs.readFile(envLocalPath, "utf-8");
    } catch {
      const envPath = path.resolve(__dirname, ".env");
      envContent = await fs.readFile(envPath, "utf-8");
      usingPath = envPath;
    }

    const lines = envContent.split(/\r?\n/);
    let replaced = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith("ADMIN_SECRET=")) {
        lines[i] = `ADMIN_SECRET=${encryptedNewPassword}`;
        replaced = true;
        break;
      }
    }
    if (!replaced) lines.push(`ADMIN_SECRET=${encryptedNewPassword}`);
    await fs.writeFile(usingPath, lines.join("\n"), "utf-8");

    // Update runtime env
    process.env.ADMIN_SECRET = encryptedNewPassword;

    return res.json({ success: true, message: "Admin password has been reset successfully." });
  } catch (error) {
    console.error("[POST /api/admin/forgot-password/verify]", error);
    return res.status(500).json({ error: "Failed to reset password. Please try again." });
  }
});

/**
 * POST /api/admin/logout – Clear admin session
 */
app.post("/api/admin/logout", async (req, res) => {
  res.setHeader("Set-Cookie", clearTokenCookie());
  return res.json({ success: true });
});

/**
 * POST /api/admin/change-password – Change admin credentials dynamically (admin only)
 */
app.post("/api/admin/change-password", async (req, res) => {
  if (!verifyToken(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { currentPassword, newPassword } = req.body;
    const adminSecret = decrypt(process.env.ADMIN_SECRET);
    const masterSecret = decrypt(process.env.MASTER_SECRET || "RoopSariPalaceMaster2026!@");

    let envKeyToUpdate = null;
    if (currentPassword === adminSecret) {
      envKeyToUpdate = "ADMIN_SECRET";
    } else if (currentPassword === masterSecret) {
      envKeyToUpdate = "MASTER_SECRET";
    }

    if (!envKeyToUpdate) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    if (!newPassword || newPassword.trim().length < 4) {
      return res.status(400).json({ error: "New password must be at least 4 characters long" });
    }

    const envLocalPath = path.resolve(__dirname, ".env.local");
    let envContent = "";
    let usingPath = envLocalPath;

    try {
      envContent = await fs.readFile(envLocalPath, "utf-8");
    } catch {
      // Fallback to .env
      const envPath = path.resolve(__dirname, ".env");
      envContent = await fs.readFile(envPath, "utf-8");
      usingPath = envPath;
    }

    const encryptedNewPassword = encrypt(newPassword.trim());

    // Update securely using line-by-line logic
    const lines = envContent.split(/\r?\n/);
    let replaced = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith(`${envKeyToUpdate}=`)) {
        lines[i] = `${envKeyToUpdate}=${encryptedNewPassword}`;
        replaced = true;
        break;
      }
    }
    if (!replaced) {
      lines.push(`${envKeyToUpdate}=${encryptedNewPassword}`);
    }
    envContent = lines.join("\n");

    await fs.writeFile(usingPath, envContent, "utf-8");
    
    // Update process.env at runtime
    process.env[envKeyToUpdate] = encryptedNewPassword;

    return res.json({ success: true, message: `${envKeyToUpdate === "MASTER_SECRET" ? "Master" : "Admin"} password updated successfully!` });
  } catch (error) {
    console.error("[POST /api/admin/change-password]", error);
    return res.status(500).json({ error: "Failed to update password" });
  }
});

/**
 * GET /api/admin/export – Export all customers as CSV (admin only)
 */
app.get("/api/admin/export", async (req, res) => {
  if (!verifyToken(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
    });

    const headers = ["ID", "Name", "Phone", "Email", "Date"];
    const rows = customers.map((c) => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.phone}"`,
      `"${c.email}"`,
      `"${new Date(c.createdAt).toLocaleString("en-US")}"`,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="roopsari-customers-${new Date().toISOString().slice(0, 10)}.csv"`);
    return res.status(200).send(csv);
  } catch (error) {
    console.error("[GET /api/admin/export]", error);
    return res.status(500).json({ error: "Export failed" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
