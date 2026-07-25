// Dynamic sitemap generator for Renu Fashion Hub (Supabase-backed)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const baseUrl = "https://www.renufashionhub.in";
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

function escapeXml(unsafe) {
  if (!unsafe) return "";
  return String(unsafe).replace(/[<>&'"]/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;'
  }[c]));
}

// Only emit a real lastmod from an authoritative timestamp; otherwise omit.
function realLastmod(row) {
  const ts = row.updated_at || row.timestamp || row.created_at;
  if (!ts) return null;
  const d = new Date(ts);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('.')[0] + 'Z';
}

async function fetchCollection(tableName) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return [];
  try {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) {
      console.error(`Sitemap: failed to fetch ${tableName}:`, error.message);
      return [];
    }
    return (data || [])
      .filter((row) => row.id !== 999999 && row.category !== "site_settings")
      .map((row) => ({
        id: String(row.id),
        lastmod: realLastmod(row),
      }));
  } catch (err) {
    console.error(`Sitemap: fetch error for ${tableName}:`, err);
    return [];
  }
}

function urlBlock({ loc, lastmod, changefreq, priority }) {
  const parts = [`  <url>`, `    <loc>${loc}</loc>`];
  if (lastmod) parts.push(`    <lastmod>${lastmod}</lastmod>`);
  if (changefreq) parts.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority) parts.push(`    <priority>${priority}</priority>`);
  parts.push(`  </url>`);
  return parts.join('\n');
}

export default async function handler(req, res) {
  try {
    const [products, posts, blogs] = await Promise.all([
      fetchCollection("products"),
      fetchCollection("posts"),
      fetchCollection("blogs"),
    ]);

    const staticPages = [
      { loc: `${baseUrl}/`, changefreq: "daily", priority: "1.0" },
      { loc: `${baseUrl}/about`, changefreq: "monthly", priority: "0.7" },
      { loc: `${baseUrl}/blog`, changefreq: "daily", priority: "0.9" },
      { loc: `${baseUrl}/contact`, changefreq: "monthly", priority: "0.6" },
      { loc: `${baseUrl}/privacy-policy`, changefreq: "yearly", priority: "0.3" },
      { loc: `${baseUrl}/terms-of-service`, changefreq: "yearly", priority: "0.3" },
      { loc: `${baseUrl}/disclaimer`, changefreq: "yearly", priority: "0.3" },
    ];

    const urls = [];
    staticPages.forEach(p => urls.push(urlBlock(p)));

    products.forEach(p => urls.push(urlBlock({
      loc: `${baseUrl}/product/${escapeXml(encodeURIComponent(p.id))}`,
      lastmod: p.lastmod,
      changefreq: "weekly",
      priority: "0.8",
    })));

    blogs.forEach(b => urls.push(urlBlock({
      loc: `${baseUrl}/blog/${escapeXml(encodeURIComponent(b.id))}`,
      lastmod: b.lastmod,
      changefreq: "monthly",
      priority: "0.7",
    })));

    posts.forEach(p => urls.push(urlBlock({
      loc: `${baseUrl}/post/${escapeXml(encodeURIComponent(p.id))}`,
      lastmod: p.lastmod,
      changefreq: "monthly",
      priority: "0.6",
    })));

    const xml = [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
      ...urls,
      `</urlset>`,
    ].join('\n');

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=600, s-maxage=3600");
    res.status(200).send(xml);
  } catch (err) {
    console.error("Sitemap generation failed:", err);
    res.status(500).send("Sitemap generation error");
  }
}
