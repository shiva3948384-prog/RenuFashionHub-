import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import compression from "compression";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

let __filename = "";
let __dirname = "";
try {
  __filename = fileURLToPath(import.meta.url);
  __dirname = path.dirname(__filename);
} catch (e) {
  __filename = process.cwd();
  __dirname = process.cwd();
}

async function startServer() {
  const app = express();
  app.use(compression());
  const PORT = 3000;

  const baseUrl = "https://www.renufashionhub.in";

  const SUPABASE_URL = process.env.SUPABASE_URL || "";
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  // XML escaping utility to avoid SEMrush / structural parsing alerts
  function escapeXml(unsafe: string): string {
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

  // Helper to fetch collection docs via Supabase Client
  async function fetchCollectionDocs(tableName: string) {
    try {
      const { data, error } = await supabase.from(tableName).select('*');
      if (error) {
        console.error(`Failed to fetch ${tableName} from Supabase:`, error.message);
        return [];
      }
      return (data || []).map((row: any) => {
        let lastmod = new Date().toISOString().split('.')[0] + 'Z';
        const timestampField = row.timestamp || row.created_at;
        if (timestampField) {
          try {
            const d = new Date(timestampField);
            if (!isNaN(d.getTime())) {
              lastmod = d.toISOString().split('.')[0] + 'Z';
            }
          } catch (e) {
            // Ignore format errors and keep default
          }
        }

        return {
          id: String(row.id),
          lastmod,
          category: row.category ? String(row.category) : ""
        };
      });
    } catch (err) {
      console.error(`Failed to fetch collection ${tableName} via Supabase Client:`, err);
      return [];
    }
  }

  // API router or health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Fully dynamic sitemap XML endpoint
  app.get("/sitemap.xml", async (req, res) => {
    try {
      // Fetch dynamic content from Supabase in parallel
      const [products, posts, blogs] = await Promise.all([
        fetchCollectionDocs("products"),
        fetchCollectionDocs("posts"),
        fetchCollectionDocs("blogs")
      ]);

      // Collect categories dynamically
      const staticCategories = ["Sarees", "Kurtas", "Lehengas", "Dresses", "Jewelry"];
      const dynamicCategories = new Set<string>(staticCategories);

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

      // Construct dynamic sitemap XML
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

      // Render Dynamic Category Filtering URLs
      Array.from(dynamicCategories).forEach(cat => {
        const escapedCat = escapeXml(encodeURIComponent(cat));
        xml += `  <url>
    <loc>${baseUrl}/?category=${escapedCat}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>\n`;
      });

      // Render Dynamic Products pages
      products.forEach(p => {
        const escapedId = escapeXml(encodeURIComponent(p.id));
        xml += `  <url>
    <loc>${baseUrl}/product/${escapedId}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
      });

      // Render Dynamic Lifestyle Posts/Vlogs Pages
      posts.forEach(p => {
        const escapedId = escapeXml(encodeURIComponent(p.id));
        xml += `  <url>
    <loc>${baseUrl}/post/${escapedId}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
      });

      // Render Dynamic Editorial Blog Posts Pages
      blogs.forEach(b => {
        const escapedId = escapeXml(encodeURIComponent(b.id));
        xml += `  <url>
    <loc>${baseUrl}/blog/${escapedId}</loc>
    <lastmod>${b.lastmod}</lastmod>
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
      // Fallback simple sitemap in the rare case of overall failure so Google bots get a valid response
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
  });

  // Dynamic SEO and metadata injector for specific route requests
  async function serveSeoHtml(req: any, res: any, type: string) {
    let title = "Renu Fashion Hub";
    let description = "Premium Fashion • Latest Trends • Style Hub. Elevating your style every day ✨";
    let image = `${baseUrl}/favicon.png`;
    let url = `${baseUrl}`;

    try {
      const { id } = req.params;
      if (id) {
        const cleanId = String(id).split('?')[0];
        const bigIntId = parseInt(cleanId, 10);

        if (!isNaN(bigIntId)) {
          if (type === "blog") {
            const { data: blog, error } = await supabase
              .from('blogs')
              .select('*')
              .eq('id', bigIntId)
              .single();

            if (!error && blog) {
              title = (blog as any).seo_title || `${(blog as any).title} - Renu Fashion Hub`;
              description = (blog as any).meta_description || (blog as any).excerpt || description;
              image = (blog as any).image_url || image;
              url = `${baseUrl}/blog/${cleanId}`;
            }
          } else if (type === "product") {
            const { data: product, error } = await supabase
              .from('products')
              .select('*')
              .eq('id', bigIntId)
              .single();

            if (!error && product) {
              title = `${(product as any).name} - Renu Fashion Hub`;
              description = (product as any).description || description;
              image = (product as any).image_url || image;
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
      console.error("Database lookup error in server seo handler:", dbErr);
    }

    // Read index.html
    let html = "";
    const distPath = path.join(process.cwd(), 'dist');
    try {
      html = fs.readFileSync(path.join(distPath, 'index.html'), 'utf8');
    } catch (fileErr) {
      try {
        html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
      } catch (e) {
        html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeXml(title)}</title>
    <meta name="description" content="${escapeXml(description)}" />
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
      }
    }

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
      <title>${escapeXml(title)}</title>
      <meta name="description" content="${escapeXml(description)}" />
      <link rel="canonical" href="${escapeXml(url)}" />
      <meta property="og:title" content="${escapeXml(title)}" />
      <meta property="og:description" content="${escapeXml(description)}" />
      <meta property="og:image" content="${escapeXml(image)}" />
      <meta property="og:url" content="${escapeXml(url)}" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="${escapeXml(title)}" />
      <meta name="twitter:description" content="${escapeXml(description)}" />
      <meta name="twitter:image" content="${escapeXml(image)}" />
`;
      html = html.replace(/<\/head>/i, `${cleanMeta}\n</head>`);
    } catch (replaceErr) {
      console.error("Replacement failed in server seo handler:", replaceErr);
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
  }

  // Bind SEO handlers to routes before serving general SPA fallback
  app.get("/blog/:id", (req, res) => serveSeoHtml(req, res, "blog"));
  app.get("/product/:id", (req, res) => serveSeoHtml(req, res, "product"));
  app.get("/post/:id", (req, res) => serveSeoHtml(req, res, "post"));

  // Vite development vs production asset serving configuration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} with dynamic sitemap generation.`);
  });
}

startServer();
