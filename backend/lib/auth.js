import "./env.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const TOKEN_NAME = "roopsari_admin_token";

/**
 * Signs a JWT token for the admin user.
 */
export function signToken() {
  return jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "24h" });
}

/**
 * Verifies a JWT token from request cookies.
 * Returns true if valid, false otherwise.
 */
export function verifyToken(req) {
  try {
    const cookieHeader = req.headers.cookie || "";
    const match = cookieHeader.match(
      new RegExp(`${TOKEN_NAME}=([^;]+)`)
    );
    if (!match) return false;

    jwt.verify(match[1], JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates a Set-Cookie header string for the admin token.
 */
export function createTokenCookie(token) {
  const maxAge = 60 * 60 * 24; // 24 hours
  return `${TOKEN_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

/**
 * Creates a Set-Cookie header to clear the admin token.
 */
export function clearTokenCookie() {
  return `${TOKEN_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
