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
  app.use(express.json({ limit: "50mb" }));
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
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return [];
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

  // Combine both collections - now we just use Supabase!
  async function fetchCombinedDocs(tableName: string) {
    return fetchCollectionDocs(tableName);
  }

  // API router or health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Fetch blogs from Supabase
  app.get("/api/blogs", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .order("id", { ascending: false });
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      console.error("GET /api/blogs error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Fetch products from Supabase
  app.get("/api/products", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("id", { ascending: false });
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      console.error("GET /api/products error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Submit a public review for a product in Supabase
  app.post("/api/products/:id/reviews", async (req, res) => {
    try {
      const productId = parseInt(req.params.id, 10);
      const { user, rating, comment } = req.body || {};
      if (!user || !comment) {
        return res.status(400).json({ error: "Missing required fields: user or comment" });
      }

      // 1. Fetch current product reviews
      const { data: product, error: fetchErr } = await supabase
        .from("products")
        .select("reviews")
        .eq("id", productId)
        .single();

      if (fetchErr || !product) {
        return res.status(404).json({ error: "Product not found" });
      }

      const reviews = Array.isArray(product.reviews) ? product.reviews : [];
      const newReview = {
        id: Date.now(),
        user,
        rating: typeof rating === "number" ? rating : 5,
        comment,
        date: new Date().toISOString()
      };

      reviews.push(newReview);

      // 2. Update reviews array in Supabase
      const { error: updateErr } = await supabase
        .from("products")
        .update({ reviews })
        .eq("id", productId);

      if (updateErr) throw updateErr;

      res.json({ success: true, review: newReview });
    } catch (err: any) {
      console.error("POST /api/products/:id/reviews error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Fetch posts/vlogs from Supabase
  app.get("/api/posts", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("id", { ascending: false });
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      console.error("GET /api/posts error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Fetch and save site profile settings
  const PROFILE_FILE_PATH = path.join(process.cwd(), "backups", "settings_profile.json");
  const DEFAULT_PROFILE = {
    name: "Renu Fashion Hub",
    bio: "Fashion Hub & Affiliate Store",
    avatar: "",
    privacyPolicy: "",
    termsOfService: ""
  };

  app.get("/api/settings/profile", (req, res) => {
    try {
      if (fs.existsSync(PROFILE_FILE_PATH)) {
        const data = fs.readFileSync(PROFILE_FILE_PATH, "utf8");
        res.json(JSON.parse(data));
      } else {
        res.json(DEFAULT_PROFILE);
      }
    } catch (err: any) {
      res.json(DEFAULT_PROFILE);
    }
  });

  app.post("/api/settings/profile", (req, res) => {
    try {
      const data = req.body || {};
      fs.writeFileSync(PROFILE_FILE_PATH, JSON.stringify(data, null, 2), "utf8");
      res.json({ success: true, data });
    } catch (err: any) {
      console.error("POST /api/settings/profile error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Manage messages/leads (with fallback local backup if table doesn't exist yet)
  const MESSAGES_FILE_PATH = path.join(process.cwd(), "backups", "messages.json");

  app.get("/api/messages", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("id", { ascending: false });
      
      if (!error) {
        return res.json(data || []);
      }
      console.log("Using local messages backup.");
    } catch (err) {
      // Ignore
    }

    try {
      if (fs.existsSync(MESSAGES_FILE_PATH)) {
        const data = fs.readFileSync(MESSAGES_FILE_PATH, "utf8");
        return res.json(JSON.parse(data));
      }
    } catch (err) {
      // Ignore
    }
    return res.json([]);
  });

  app.post("/api/messages", async (req, res) => {
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
        return res.json({ success: true, source: "supabase" });
      }
      console.log("Saving message to local backup.");
    } catch (err) {
      // Ignore
    }

    try {
      let currentMessages = [];
      if (fs.existsSync(MESSAGES_FILE_PATH)) {
        currentMessages = JSON.parse(fs.readFileSync(MESSAGES_FILE_PATH, "utf8"));
      }
      currentMessages.unshift(newMessage);
      fs.writeFileSync(MESSAGES_FILE_PATH, JSON.stringify(currentMessages, null, 2), "utf8");
      return res.json({ success: true, source: "file" });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/messages/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    try {
      const { error } = await supabase.from("messages").delete().eq("id", id);
      if (!error) {
        return res.json({ success: true, source: "supabase" });
      }
    } catch (err) {
      // Ignore
    }

    try {
      if (fs.existsSync(MESSAGES_FILE_PATH)) {
        let currentMessages = JSON.parse(fs.readFileSync(MESSAGES_FILE_PATH, "utf8"));
        currentMessages = currentMessages.filter((m: any) => m.id !== id);
        fs.writeFileSync(MESSAGES_FILE_PATH, JSON.stringify(currentMessages, null, 2), "utf8");
      }
      return res.json({ success: true, source: "file" });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Secure admin-sync proxy to keep Supabase and Firestore aligned
  app.post("/api/admin-sync", async (req, res) => {
    try {
      const {
        blogs,
        products,
        posts,
        deletedBlogIds,
        deletedProductIds,
        deletedPostIds
      } = req.body || {};

      const results = {
        blogsUpserted: 0,
        blogsDeleted: 0,
        productsUpserted: 0,
        productsDeleted: 0,
        postsUpserted: 0,
        postsDeleted: 0,
        errors: [] as string[]
      };

      // 1. Handle Blog Upserts
      if (blogs && Array.isArray(blogs) && blogs.length > 0) {
        for (const b of blogs) {
          const id = parseInt(b.id, 10);
          if (isNaN(id)) continue;

          const dbRecord = {
            id,
            title: b.title || "",
            excerpt: b.excerpt || "",
            content: b.content || "",
            category: b.category || "",
            image_url: b.image_url || b.image || null,
            seo_title: b.seo_title || b.seoTitle || b.title || "",
            meta_description: b.meta_description || b.metaDescription || b.excerpt || "",
            focus_keyword: b.focus_keyword || b.focusKeyword || "",
            timestamp: b.timestamp || new Date().toISOString()
          };

          const { error } = await supabase.from('blogs').upsert(dbRecord);
          if (error) {
            console.error(`Error upserting blog ${id} to Supabase:`, error.message);
            results.errors.push(`Blog ${id}: ${error.message}`);
          } else {
            results.blogsUpserted++;
          }
        }
      }

      // 2. Handle Product Upserts
      if (products && Array.isArray(products) && products.length > 0) {
        for (const p of products) {
          const id = parseInt(p.id, 10);
          if (isNaN(id)) continue;

          const dbRecord = {
            id,
            name: p.name || "",
            buy_url: p.buyUrl || p.buy_url || null,
            price: p.price || null,
            image_url: p.image_url || p.url || p.image || null,
            description: p.description || "",
            category: p.category || "",
            reviews: p.reviews || []
          };

          const { error } = await supabase.from('products').upsert(dbRecord);
          if (error) {
            console.error(`Error upserting product ${id} to Supabase:`, error.message);
            results.errors.push(`Product ${id}: ${error.message}`);
          } else {
            results.productsUpserted++;
          }
        }
      }

      // 3. Handle Post/Vlog Upserts
      if (posts && Array.isArray(posts) && posts.length > 0) {
        for (const po of posts) {
          const id = parseInt(po.id, 10);
          if (isNaN(id)) continue;

          const dbRecord = {
            id,
            url: po.url || "",
            type: po.type || "video",
            tagged_products: po.taggedProducts || po.tagged_products || []
          };

          const { error } = await supabase.from('posts').upsert(dbRecord);
          if (error) {
            console.error(`Error upserting post ${id} to Supabase:`, error.message);
            results.errors.push(`Post ${id}: ${error.message}`);
          } else {
            results.postsUpserted++;
          }
        }
      }

      // 4. Handle Deletions
      if (deletedBlogIds && Array.isArray(deletedBlogIds) && deletedBlogIds.length > 0) {
        for (const idStr of deletedBlogIds) {
          const id = parseInt(idStr, 10);
          if (isNaN(id)) continue;
          const { error } = await supabase.from('blogs').delete().eq('id', id);
          if (error) results.errors.push(`Delete Blog ${id}: ${error.message}`);
          else results.blogsDeleted++;
        }
      }

      if (deletedProductIds && Array.isArray(deletedProductIds) && deletedProductIds.length > 0) {
        for (const idStr of deletedProductIds) {
          const id = parseInt(idStr, 10);
          if (isNaN(id)) continue;
          const { error } = await supabase.from('products').delete().eq('id', id);
          if (error) results.errors.push(`Delete Product ${id}: ${error.message}`);
          else results.productsDeleted++;
        }
      }

      if (deletedPostIds && Array.isArray(deletedPostIds) && deletedPostIds.length > 0) {
        for (const idStr of deletedPostIds) {
          const id = parseInt(idStr, 10);
          if (isNaN(id)) continue;
          const { error } = await supabase.from('posts').delete().eq('id', id);
          if (error) results.errors.push(`Delete Post ${id}: ${error.message}`);
          else results.postsDeleted++;
        }
      }

      if (results.errors.length > 0) {
        return res.status(207).json({
          message: "Synchronization completed with some errors",
          results
        });
      }

      return res.status(200).json({
        message: "Synchronization completed successfully",
        results
      });

    } catch (err: any) {
      console.error("Critical error in admin-sync handler:", err);
      return res.status(500).json({
        error: "Internal server error during synchronization",
        details: err.message || String(err)
      });
    }
  });

  // Fully dynamic sitemap XML endpoint
  app.get("/sitemap.xml", async (req, res) => {
    try {
      // Fetch dynamic content from both databases in parallel and merge
      const [products, posts, blogs] = await Promise.all([
        fetchCombinedDocs("products"),
        fetchCombinedDocs("posts"),
        fetchCombinedDocs("blogs")
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

        if (type === "blog" && !isNaN(parseInt(cleanId, 10))) {
          const { data, error } = await supabase
            .from('blogs')
            .select('*')
            .eq('id', parseInt(cleanId, 10))
            .single();

          if (!error && data) {
            title = data.seo_title || `${data.title} - Renu Fashion Hub`;
            description = data.meta_description || data.excerpt || description;
            image = data.image_url || image;
            url = `${baseUrl}/blog/${cleanId}`;
          }
        } else if (type === "product" && !isNaN(parseInt(cleanId, 10))) {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', parseInt(cleanId, 10))
            .single();

          if (!error && data) {
            title = `${data.name} - Renu Fashion Hub`;
            description = data.description || description;
            image = data.image_url || image;
            url = `${baseUrl}/product/${cleanId}`;
          }
        } else if (type === "post" && !isNaN(parseInt(cleanId, 10))) {
          const { data, error } = await supabase
            .from('posts')
            .select('*')
            .eq('id', parseInt(cleanId, 10))
            .single();

          if (!error && data) {
            title = `Post #${cleanId} - Renu Fashion Hub`;
            description = "Watch the latest outfit style, custom lookbook, and collection recommendation video at Renu Fashion Hub.";
            url = `${baseUrl}/post/${cleanId}`;
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
