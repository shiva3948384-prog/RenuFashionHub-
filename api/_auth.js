import crypto from "crypto";

const COOKIE_NAME = "rfh_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

function sign(value) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

function parseCookies(req) {
  const header = req.headers?.cookie || "";
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        if (index === -1) return [part, ""];
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      })
  );
}

function safeEqual(a, b) {
  const left = Buffer.from(a || "");
  const right = Buffer.from(b || "");
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function createSessionCookie() {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const nonce = crypto.randomBytes(16).toString("hex");
  const payload = `${expiresAt}.${nonce}`;
  const token = `${payload}.${sign(payload)}`;
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export function isAdminRequest(req) {
  const secret = getSecret();
  if (!secret || secret.length < 32) return false;

  const token = parseCookies(req)[COOKIE_NAME];
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [expiresAtRaw, nonce, signature] = parts;
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) return false;
  if (!/^[a-f0-9]{32}$/i.test(nonce)) return false;

  return safeEqual(signature, sign(`${expiresAtRaw}.${nonce}`));
}

export function requireAdmin(req, res) {
  if (isAdminRequest(req)) return true;
  res.setHeader("Cache-Control", "no-store");
  res.status(401).json({ error: "Unauthorized" });
  return false;
}

export function applySameOriginHeaders(req, res, methods = "GET,POST,OPTIONS") {
  const origin = req.headers?.origin;
  const host = req.headers?.host;
  if (origin && host) {
    try {
      const parsed = new URL(origin);
      if (parsed.host === host) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
        res.setHeader("Access-Control-Allow-Credentials", "true");
      }
    } catch {
      // Invalid origins are ignored.
    }
  }
  res.setHeader("Access-Control-Allow-Methods", methods);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
