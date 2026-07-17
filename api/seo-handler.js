// Serverless dynamic SEO and metadata injector for Renu Fashion Hub.
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const baseUrl = "https://www.renufashionhub.in";
const defaultTitle = "Renu Fashion Hub | Premium Fashion & Style Hub";
const defaultDescription = "Renu Fashion Hub brings women's fashion inspiration, sarees, kurtis, jewellery, outfit ideas, shopping guides, and style tips curated by Renu Agarwal.";
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

function escapeHtmlAttr(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function stripHtml(str) {
  return String(str || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function truncate(str, max = 155) {
  const clean = stripHtml(str);
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}...`;
}

export default async function handler(req, res) {
  const { type, id } = req.query;

  let title = defaultTitle;
  let description = defaultDescription;
  let image = `${baseUrl}/favicon.svg`;
  let url = `${baseUrl}/`;
  let ogType = "website";

  try {
    if (type && id) {
      const cleanId = String(id).split("?")[0];

      if (type === "blog" && !isNaN(parseInt(cleanId, 10))) {
        const { data, error } = await supabase
          .from("blogs")
          .select("*")
          .eq("id", parseInt(cleanId, 10))
          .single();

        if (!error && data && data.id !== 999999 && data.category !== "site_settings") {
          title = data.seo_title || `${data.title} - Renu Fashion Hub`;
          description = truncate(data.meta_description || data.excerpt || data.content || defaultDescription);
          image = data.image_url || image;
          url = `${baseUrl}/blog/${cleanId}`;
          ogType = "article";
        }
      } else if (type === "product" && !isNaN(parseInt(cleanId, 10))) {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", parseInt(cleanId, 10))
          .single();

        if (!error && data) {
          title = `${data.name} - Renu Fashion Hub`;
          description = truncate(data.description || `${data.name} fashion pick, price, reviews, styling details, and shopping guide at Renu Fashion Hub.`);
          image = data.image_url || image;
          url = `${baseUrl}/product/${cleanId}`;
          ogType = "product";
        }
      } else if (type === "post" && !isNaN(parseInt(cleanId, 10))) {
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .eq("id", parseInt(cleanId, 10))
          .single();

        if (!error && data) {
          title = `Fashion Style Post ${cleanId} - Renu Fashion Hub`;
          description = "Watch the latest outfit style, custom lookbook, and collection recommendation video at Renu Fashion Hub.";
          image = data.type === "image" && data.url ? data.url : image;
          url = `${baseUrl}/post/${cleanId}`;
          ogType = "article";
        }
      }
    }
  } catch (dbErr) {
    console.error("Database lookup error inside seo-handler:", dbErr);
  }

  let html = "";
  try {
    const distPath = path.join(process.cwd(), "dist", "index.html");
    if (fs.existsSync(distPath)) {
      html = fs.readFileSync(distPath, "utf8");
    } else {
      const rootPath = path.join(process.cwd(), "index.html");
      html = fs.readFileSync(rootPath, "utf8");
    }
  } catch (fileErr) {
    console.error("Failed to read HTML template in seo-handler:", fileErr);
    html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
  }

  try {
    html = html.replace(/<title>.*?<\/title>/gi, "");
    html = html.replace(/<meta\s+[^>]*name=["']description["'][^>]*>/gi, "");
    html = html.replace(/<meta\s+[^>]*name=["']keywords["'][^>]*>/gi, "");
    html = html.replace(/<meta\s+[^>]*property=["']og:title["'][^>]*>/gi, "");
    html = html.replace(/<meta\s+[^>]*property=["']og:description["'][^>]*>/gi, "");
    html = html.replace(/<meta\s+[^>]*property=["']og:type["'][^>]*>/gi, "");
    html = html.replace(/<meta\s+[^>]*property=["']og:image["'][^>]*>/gi, "");
    html = html.replace(/<meta\s+[^>]*property=["']og:url["'][^>]*>/gi, "");
    html = html.replace(/<meta\s+[^>]*name=["']twitter:card["'][^>]*>/gi, "");
    html = html.replace(/<meta\s+[^>]*name=["']twitter:title["'][^>]*>/gi, "");
    html = html.replace(/<meta\s+[^>]*name=["']twitter:description["'][^>]*>/gi, "");
    html = html.replace(/<meta\s+[^>]*name=["']twitter:image["'][^>]*>/gi, "");
    html = html.replace(/<link\s+[^>]*rel=["']canonical["'][^>]*>/gi, "");

    const cleanMeta = `
    <title>${escapeHtmlAttr(title)}</title>
    <meta name="description" content="${escapeHtmlAttr(description)}" />
    <link rel="canonical" href="${escapeHtmlAttr(url)}" />
    <meta property="og:title" content="${escapeHtmlAttr(title)}" />
    <meta property="og:description" content="${escapeHtmlAttr(description)}" />
    <meta property="og:type" content="${escapeHtmlAttr(ogType)}" />
    <meta property="og:image" content="${escapeHtmlAttr(image)}" />
    <meta property="og:url" content="${escapeHtmlAttr(url)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtmlAttr(title)}" />
    <meta name="twitter:description" content="${escapeHtmlAttr(description)}" />
    <meta name="twitter:image" content="${escapeHtmlAttr(image)}" />
`;
    html = html.replace(/<\/head>/i, `${cleanMeta}\n</head>`);
  } catch (replaceErr) {
    console.error("Regex replacement failed in seo-handler:", replaceErr);
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=60, s-maxage=3600");
  res.status(200).send(html);
}
