// Dynamic sitemap generator for Renu Fashion Hub supporting both Firestore & Supabase
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
    autoRefreshToken: false
  }
});

// XML escaping utility to avoid SEMrush / structural parsing alerts
function escapeXml(unsafe) {
  if (!unsafe) return "";
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

// Fetch collection items via Supabase Client
async function fetchCollectionDocsSupabase(tableName) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return [];
  try {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) {
      console.error(`Failed to fetch ${tableName} from Supabase:`, error.message);
      return [];
    }
    return (data || []).map((row) => {
      let lastmod = new Date().toISOString().split('.')[0] + 'Z';
      const timestampField = row.timestamp || row.created_at;
      if (timestampField) {
        try {
          const d = new Date(timestampField);
          if (!isNaN(d.getTime())) {
            lastmod = d.toISOString().split('.')[0] + 'Z';
          }
        } catch (e) {}
      }

      return {
        id: String(row.id),
        lastmod,
        category: row.category ? String(row.category) : ""
      };
    });
  } catch (err) {
    console.error(`Failed to fetch ${tableName} via Supabase Client:`, err);
    return [];
  }
}

// Fetch only from Supabase
async function fetchCombinedDocs(tableName) {
  return fetchCollectionDocsSupabase(tableName);
}

export default async function handler(req, res) {
  try {
    // Fetch combined collections in parallel
    const [products, posts, blogs] = await Promise.all([
      fetchCombinedDocs("products"),
      fetchCombinedDocs("posts"),
      fetchCombinedDocs("blogs")
    ]);

    // Aggregate unique active categories
    const staticCategories = ["Sarees", "Kurtas", "Lehengas", "Dresses", "Jewelry"];
    const dynamicCategories = new Set(staticCategories);
    
    products.forEach(p => {
      if (p.category && p.category.toLowerCase() !== "other") {
        dynamicCategories.add(p.category.charAt(0).toUpperCase() + p.category.slice(1).toLowerCase());
      }
    });

    posts.forEach(p => {
      if (p.category && p.category.toLowerCase() !== "other") {
        dynamicCategories.add(p.category.charAt(0).toUpperCase() + p.category.slice(1).toLowerCase());
      }
    });

    // Start constructing the sitemap XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Core Static Pages -->
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/login</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/privacy-policy</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/terms-of-service</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/disclaimer</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
`;

    // Categories query URLs
    Array.from(dynamicCategories).forEach(cat => {
      const escapedCat = escapeXml(encodeURIComponent(cat));
      xml += `  <url>
    <loc>${baseUrl}/?category=${escapedCat}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>\n`;
    });

    // Dynamic Products
    products.forEach(p => {
      const escapedId = escapeXml(encodeURIComponent(p.id));
      xml += `  <url>
    <loc>${baseUrl}/product/${escapedId}</loc>
    <lastmod>${p.lastmod || "2026-06-22T00:00:00Z"}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
    });

    // Dynamic Posts/Vlogs
    posts.forEach(p => {
      const escapedId = escapeXml(encodeURIComponent(p.id));
      xml += `  <url>
    <loc>${baseUrl}/post/${escapedId}</loc>
    <lastmod>${p.lastmod || "2026-06-22T00:00:00Z"}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
    });

    // Dynamic Blogs
    blogs.forEach(b => {
      const escapedId = escapeXml(encodeURIComponent(b.id));
      xml += `  <url>
    <loc>${baseUrl}/blog/${escapedId}</loc>
    <lastmod>${b.lastmod || "2026-06-22T00:00:00Z"}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
    });

    xml += `</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.status(200).send(xml);
  } catch (err) {
    console.error("Critical error in sitemap generation:", err);
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    res.setHeader("Content-Type", "application/xml");
    res.status(200).send(fallbackXml);
  }
}
