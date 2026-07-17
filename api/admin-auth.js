import crypto from "crypto";
import {
  applySameOriginHeaders,
  clearSessionCookie,
  createSessionCookie,
  isAdminRequest,
} from "./_auth.js";

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function safeEqualHex(a, b) {
  const left = Buffer.from(a || "", "hex");
  const right = Buffer.from(b || "", "hex");
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function safeEqualText(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function verifyCredentials(username, password) {
  const expectedUsername = process.env.ADMIN_USERNAME || "";
  const salt = process.env.ADMIN_PASSWORD_SALT || "";
  const expectedHash = process.env.ADMIN_PASSWORD_HASH || "";
  if (!username || !expectedUsername || !password || !salt || !expectedHash) return false;
  if (!safeEqualText(username, expectedUsername)) return false;
  return safeEqualHex(hashPassword(password, salt), expectedHash);
}

export default async function handler(req, res) {
  applySameOriginHeaders(req, res, "GET,POST,DELETE,OPTIONS");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({ authenticated: isAdminRequest(req) });
  }

  if (req.method === "DELETE") {
    res.setHeader("Set-Cookie", clearSessionCookie());
    return res.status(200).json({ success: true });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { username, password } = req.body || {};
  if (!verifyCredentials(username, password)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  res.setHeader("Set-Cookie", createSessionCookie());
  return res.status(200).json({ success: true });
}
