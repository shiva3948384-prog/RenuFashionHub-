// Serverless dynamic SEO and metadata injector for Renu Fashion Hub supporting both Firestore & Supabase
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

// Load config or set default metadata
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
  const { type, id } = req.query;

  let title = "Renu Fashion Hub";
  let description = "Premium Fashion • Latest Trends • Style Hub. Elevating your style every day ✨";
  let image = `${baseUrl}/favicon.png`;
  let url = `${baseUrl}`;

  try {
    if (type && id) {
      const cleanId = String(id).split('?')[0];

      if (type === "blog") {
        let blog = null;
        if (!isNaN(parseInt(cleanId, 10))) {
          const { data, error } = await supabase
            .from('blogs')
            .select('*')
            .eq('id', parseInt(cleanId, 10))
            .single();
          if (!error && data) {
            blog = {
              id: String(data.id),
              title: data.title,
              excerpt: data.excerpt,
              image_url: data.image_url,
              seo_title: data.seo_title,
              meta_description: data.meta_description
            };
          }
        }

        if (blog) {
          title = blog.seo_title || `${blog.title} - Renu Fashion Hub`;
          description = blog.meta_description || blog.excerpt || description;
          image = blog.image_url || image;
          url = `${baseUrl}/blog/${cleanId}`;
        }
      } else if (type === "product") {
        let product = null;
        if (!isNaN(parseInt(cleanId, 10))) {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', parseInt(cleanId, 10))
            .single();
          if (!error && data) {
            product = {
              id: String(data.id),
              name: data.name,
              description: data.description,
              image_url: data.image_url
            };
          }
        }

        if (product) {
          title = `${product.name} - Renu Fashion Hub`;
          description = product.description || description;
          image = product.image_url || image;
          url = `${baseUrl}/product/${cleanId}`;
        }
      } else if (type === "post") {
        let post = null;
        if (!isNaN(parseInt(cleanId, 10))) {
          const { data, error } = await supabase
            .from('posts')
            .select('*')
            .eq('id', parseInt(cleanId, 10))
            .single();
          if (!error && data) {
            post = {
              id: String(data.id)
            };
          }
        }

        if (post) {
          title = `Post #${cleanId} - Renu Fashion Hub`;
          description = "Watch the latest outfit style, custom lookbook, and collection recommendation video at Renu Fashion Hub.";
          url = `${baseUrl}/post/${cleanId}`;
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

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=60, s-maxage=3600");
  res.status(200).send(html);
}
