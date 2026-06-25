import fs from 'fs';
import path from 'path';

const PROFILE_FILE_PATH = path.join(process.cwd(), "backups", "settings_profile.json");
const DEFAULT_PROFILE = {
  name: "Renu Fashion Hub",
  bio: "Fashion Hub & Affiliate Store",
  avatar: "",
  privacyPolicy: "",
  termsOfService: ""
};

export default async function handler(req, res) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const tmpPath = "/tmp/settings_profile.json";
      if (fs.existsSync(tmpPath)) {
        const data = fs.readFileSync(tmpPath, "utf8");
        return res.status(200).json(JSON.parse(data));
      } else if (fs.existsSync(PROFILE_FILE_PATH)) {
        const data = fs.readFileSync(PROFILE_FILE_PATH, "utf8");
        return res.status(200).json(JSON.parse(data));
      } else {
        return res.status(200).json(DEFAULT_PROFILE);
      }
    } catch (err) {
      return res.status(200).json(DEFAULT_PROFILE);
    }
  }

  if (req.method === 'POST') {
    try {
      const data = req.body || {};
      try {
        fs.writeFileSync(PROFILE_FILE_PATH, JSON.stringify(data, null, 2), "utf8");
      } catch (fileErr) {
        // Fallback for Vercel's read-only filesystem
        const tmpPath = "/tmp/settings_profile.json";
        fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf8");
      }
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error("Vercel API POST /api/settings/profile error:", err);
      return res.status(500).json({ error: err.message || String(err) });
    }
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
