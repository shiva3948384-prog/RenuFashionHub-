import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

export default async function handler(req, res) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  try {
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    const mappedBlogs = (data || [])
      .filter(b => b.id !== 999999 && b.category !== "site_settings")
      .map(b => ({
        id: b.id,
        title: b.title,
        excerpt: b.excerpt || "",
        content: b.content || "",
        category: b.category || "",
        image: b.image_url || "",
        seoTitle: b.seo_title || "",
        metaDescription: b.meta_description || "",
        focusKeyword: b.focus_keyword || "",
        timestamp: b.timestamp || new Date().toISOString()
      }));

    return res.status(200).json(mappedBlogs);
  } catch (err) {
    console.error('Vercel API /api/blogs error:', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}
