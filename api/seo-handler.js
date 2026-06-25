// Serverless dynamic SEO and metadata injector for Renu Fashion Hub
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const baseUrl = "https://www.renufashionhub.in";
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

export default async function handler(req, res) {
  // Use Vercel request query parsing
  const { type, id } = req.query;

  let title = "Renu Fashion Hub";
  let description = "Premium Fashion • Latest Trends • Style Hub. Elevating your style every day ✨";
  let image = `${baseUrl}/favicon.png`;
  let url = `${baseUrl}`;

  try {
    if (type && id) {
      const cleanId = String(id).split('?')[0]; // strip trailing query params if any
      const bigIntId = parseInt(cleanId, 10);

      if (!isNaN(bigIntId)) {
        if (type === "blog") {
          const { data: blog, error } = await supabase
            .from('blogs')
            .select('*')
            .eq('id', bigIntId)
            .single();

          if (!error && blog) {
            title = blog.seo_title || `${blog.title} - Renu Fashion Hub`;
            description = blog.meta_description || blog.excerpt || description;
            image = blog.image_url || image;
            url = `${baseUrl}/blog/${cleanId}`;
          }
        } else if (type === "product") {
          const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', bigIntId)
            .single();

          if (!error && product) {
            title = `${product.name} - Renu Fashion Hub`;
            description = product.description || description;
            image = product.image_url || image;
            url = `${baseUrl}/product/${cleanId}`;
          }
        } else if (type === "post") {
          const { data: post, error } = await supabase
            .from('posts')
            .select('*')
            .eq('id', bigIntId)
            .single();

          if (!error && post) {
            title = `Post #${cleanId} - Renu Fashion Hub`;
            description = "Watch the latest outfit style, custom lookbook, and collection recommendation video at Renu Fashion Hub.";
            url = `${baseUrl}/post/${cleanId}`;
          }
        }
      }
    }
  } catch (dbErr) {
    console.error("Database lookup error inside seo-handler:", dbErr);
  }

  // Read index.html as template
  let html = "";
  try {
    const distPath = path.join(process.cwd(), 'dist', 'index.html');
    if (fs.existsSync(distPath)) {
      html = fs.readFileSync(distPath, 'utf8');
    } else {
      const rootPath = path.join(process.cwd(), 'index.html');
      html = fs.readFileSync(rootPath, 'utf8');
    }
  } catch (fileErr) {
    console.error("Failed to read HTML template in seo-handler:", fileErr);
    // Simple fallback template if reading files completely fails
    html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtmlAttr(title)}</title>
    <meta name="description" content="${escapeHtmlAttr(description)}" />
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
  }

  // Inject/Replace HTML Metadata Tags with robust clean-and-inject strategy
  try {
    // Strip any existing title, meta description, keywords, og:*, twitter:*, and canonical link tags to avoid duplicates
    html = html.replace(/<title>.*?<\/title>/gi, '');
    html = html.replace(/<meta\s+[^>]*name=["']description["'][^>]*>/gi, '');
    html = html.replace(/<meta\s+[^>]*name=["']keywords["'][^>]*>/gi, '');
    html = html.replace(/<meta\s+[^>]*property=["']og:title["'][^>]*>/gi, '');
    html = html.replace(/<meta\s+[^>]*property=["']og:description["'][^>]*>/gi, '');
    html = html.replace(/<meta\s+[^>]*property=["']og:image["'][^>]*>/gi, '');
    html = html.replace(/<meta\s+[^>]*property=["']og:url["'][^>]*>/gi, '');
    html = html.replace(/<meta\s+[^>]*name=["']twitter:card["'][^>]*>/gi, '');
    html = html.replace(/<meta\s+[^>]*name=["']twitter:title["'][^>]*>/gi, '');
    html = html.replace(/<meta\s+[^>]*name=["']twitter:description["'][^>]*>/gi, '');
    html = html.replace(/<meta\s+[^>]*name=["']twitter:image["'][^>]*>/gi, '');
    html = html.replace(/<link\s+[^>]*rel=["']canonical["'][^>]*>/gi, '');

    // Inject our fresh, correct tags right before </head>
    const cleanMeta = `
    <title>${escapeHtmlAttr(title)}</title>
    <meta name="description" content="${escapeHtmlAttr(description)}" />
    <link rel="canonical" href="${escapeHtmlAttr(url)}" />
    <meta property="og:title" content="${escapeHtmlAttr(title)}" />
    <meta property="og:description" content="${escapeHtmlAttr(description)}" />
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

  // Send output HTML
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=60, s-maxage=3600");
  res.status(200).send(html);
}
