import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { applySameOriginHeaders, requireAdmin } from './_auth.js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

const PROFILE_FILE_PATH = path.join(process.cwd(), "backups", "settings_profile.json");
const DEFAULT_PROFILE = {
  name: "Renu Fashion Hub",
  bio: "Fashion Hub & Affiliate Store",
  avatar: "",
  privacyPolicy: "",
  termsOfService: ""
};

// Helper to parse base64 image strings
function parseBase64(base64Str) {
  if (!base64Str || !base64Str.startsWith('data:image/')) return null;
  const matches = base64Str.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) return null;
  return {
    mimeType: matches[1],
    buffer: Buffer.from(matches[2], 'base64')
  };
}

// Upload parsed image buffer to a Supabase storage bucket and return the public URL
async function uploadImageToStorage(bucket, id, base64Str) {
  try {
    const parsed = parseBase64(base64Str);
    if (!parsed) return null;

    const extension = parsed.mimeType.split('/')[1] || 'jpg';
    const fileName = `${id}_${Date.now()}.${extension}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, parsed.buffer, {
        contentType: parsed.mimeType,
        upsert: true
      });

    if (error) {
      console.error(`Failed to upload image for ID ${id} to ${bucket}:`, error.message);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return publicUrl;
  } catch (err) {
    console.error(`Exception uploading image for ID ${id} to ${bucket}:`, err.message);
    return null;
  }
}

export default async function handler(req, res) {
  applySameOriginHeaders(req, res, 'GET,POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      // 1. Try to fetch from Supabase blogs table (special ID 999999)
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const { data, error } = await supabase
          .from("blogs")
          .select("*")
          .eq("id", 999999)
          .single();

        if (!error && data) {
          try {
            const parsed = JSON.parse(data.content);
            return res.status(200).json(parsed);
          } catch (e) {
            console.error("Failed to parse settings JSON from database, trying fallback:", e);
          }
        }
      }

      // Fallback: local file if it exists, otherwise default
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
    if (!requireAdmin(req, res)) return;

    try {
      const data = req.body || {};

      // Upload avatar to Supabase Storage if it's base64
      let avatarUrl = data.avatar || "";
      if (avatarUrl && avatarUrl.startsWith("data:image/") && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const uploadedUrl = await uploadImageToStorage("blog-images", 999999, avatarUrl);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
          data.avatar = uploadedUrl;
        }
      }

      // 1. Write locally as backup
      try {
        if (!fs.existsSync(path.dirname(PROFILE_FILE_PATH))) {
          fs.mkdirSync(path.dirname(PROFILE_FILE_PATH), { recursive: true });
        }
        fs.writeFileSync(PROFILE_FILE_PATH, JSON.stringify(data, null, 2), "utf8");
      } catch (fileErr) {
        // Fallback for Vercel's read-only filesystem
        const tmpPath = "/tmp/settings_profile.json";
        try {
          fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf8");
        } catch (e) {
          console.error("Failed to write to tmp file:", e);
        }
      }

      // 2. Upsert into Supabase blogs table with ID 999999
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const { error } = await supabase
          .from("blogs")
          .upsert({
            id: 999999,
            title: data.name || "Renu Fashion Hub",
            excerpt: data.bio || "Fashion Hub & Affiliate Store",
            content: JSON.stringify(data),
            category: "site_settings",
            image_url: avatarUrl,
            timestamp: new Date().toISOString()
          });

        if (error) {
          console.error("Failed to upsert settings to Supabase in Serverless function:", error.message);
        }
      }

      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error("Vercel API POST /api/settings/profile error:", err);
      return res.status(500).json({ error: err.message || String(err) });
    }
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
