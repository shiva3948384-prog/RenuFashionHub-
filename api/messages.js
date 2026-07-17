import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { applySameOriginHeaders, requireAdmin } from './_auth.js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

const MESSAGES_FILE_PATH = path.join(process.cwd(), "backups", "messages.json");

export default async function handler(req, res) {
  applySameOriginHeaders(req, res, 'GET,POST,DELETE,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  // 1. DELETE: Delete a message by ID
  if (req.method === 'DELETE' && id) {
    if (!requireAdmin(req, res)) return;

    const messageId = parseInt(id, 10);
    if (isNaN(messageId)) {
      return res.status(400).json({ error: "Invalid message ID" });
    }

    try {
      const { error } = await supabase.from("messages").delete().eq("id", messageId);
      if (!error) {
        return res.status(200).json({ success: true, source: "supabase" });
      }
    } catch (err) {
      console.log("Delete via Supabase failed, falling back to local file.");
    }

    try {
      if (fs.existsSync(MESSAGES_FILE_PATH)) {
        let currentMessages = JSON.parse(fs.readFileSync(MESSAGES_FILE_PATH, "utf8"));
        currentMessages = currentMessages.filter(m => m.id !== messageId);
        try {
          fs.writeFileSync(MESSAGES_FILE_PATH, JSON.stringify(currentMessages, null, 2), "utf8");
        } catch (fErr) {
          fs.writeFileSync("/tmp/messages.json", JSON.stringify(currentMessages, null, 2), "utf8");
        }
      }
      return res.status(200).json({ success: true, source: "file" });
    } catch (err) {
      return res.status(500).json({ error: err.message || String(err) });
    }
  }

  // 2. GET: Retrieve messages
  if (req.method === 'GET') {
    if (!requireAdmin(req, res)) return;

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("id", { ascending: false });
      
      if (!error) {
        return res.status(200).json(data || []);
      }
    } catch (err) {
      // Fallback
    }

    try {
      const tmpPath = "/tmp/messages.json";
      if (fs.existsSync(tmpPath)) {
        const data = fs.readFileSync(tmpPath, "utf8");
        return res.status(200).json(JSON.parse(data));
      } else if (fs.existsSync(MESSAGES_FILE_PATH)) {
        const data = fs.readFileSync(MESSAGES_FILE_PATH, "utf8");
        return res.status(200).json(JSON.parse(data));
      }
    } catch (err) {
      // Ignore
    }
    return res.status(200).json([]);
  }

  // 3. POST: Submit a message
  if (req.method === 'POST') {
    const newMessage = req.body || {};
    try {
      const { error } = await supabase.from("messages").insert({
        id: newMessage.id,
        name: newMessage.name || "",
        email: newMessage.email || "",
        mobile: newMessage.mobile || "",
        message: newMessage.message || "",
        timestamp: newMessage.timestamp || new Date().toISOString()
      });
      if (!error) {
        return res.status(200).json({ success: true, source: "supabase" });
      }
    } catch (err) {
      // Ignore
    }

    try {
      let currentMessages = [];
      const tmpPath = "/tmp/messages.json";
      if (fs.existsSync(tmpPath)) {
        currentMessages = JSON.parse(fs.readFileSync(tmpPath, "utf8"));
      } else if (fs.existsSync(MESSAGES_FILE_PATH)) {
        currentMessages = JSON.parse(fs.readFileSync(MESSAGES_FILE_PATH, "utf8"));
      }
      currentMessages.unshift(newMessage);
      try {
        fs.writeFileSync(MESSAGES_FILE_PATH, JSON.stringify(currentMessages, null, 2), "utf8");
      } catch (fErr) {
        fs.writeFileSync(tmpPath, JSON.stringify(currentMessages, null, 2), "utf8");
      }
      return res.status(200).json({ success: true, source: "file" });
    } catch (err) {
      return res.status(500).json({ error: err.message || String(err) });
    }
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
