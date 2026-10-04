// Serverless helper to synchronize frontend changes directly to Supabase
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { applySameOriginHeaders, requireAdmin } from './_auth.js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const PROFILE_FILE_PATH = path.join(process.cwd(), "backups", "settings_profile.json");
const DEFAULT_PROFILE = {
  name: "Renu Fashion Hub",
  bio: "Fashion Hub & Affiliate Store",
  avatar: "",
  privacyPolicy: "",
  termsOfService: ""
};

// Initialize Supabase with Service Role key to bypass RLS policies
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

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


// Upsert in small chunks so one oversized payload can't fail the whole batch,
// and retry row-by-row when a chunk fails so a single bad record cannot block
// every other new item (this is what previously made new products vanish).
async function upsertRecords(table, records) {
  const CHUNK_SIZE = 20;
  let saved = 0;
  const errors = [];

  for (let i = 0; i < records.length; i += CHUNK_SIZE) {
    const chunk = records.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from(table).upsert(chunk);
    if (!error) {
      saved += chunk.length;
      continue;
    }

    console.error(`Chunk upsert failed for ${table}:`, error.message);
    for (const record of chunk) {
      const { error: rowError } = await supabase.from(table).upsert(record);
      if (rowError) {
        console.error(`Row upsert failed for ${table} id ${record.id}:`, rowError.message);
        errors.push(`${table} id ${record.id}: ${rowError.message}`);
      } else {
        saved += 1;
      }
    }
  }

  return { saved, errors };
}

export default async function handler(req, res) {
  const { action } = req.query || {};

  // Handle settings profile: GET/POST /api/settings/profile
  if (action === "profile") {
    applySameOriginHeaders(req, res, 'GET,POST,OPTIONS');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method === 'GET') {
      try {
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

        let avatarUrl = data.avatar || "";
        if (avatarUrl && avatarUrl.startsWith("data:image/") && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
          const uploadedUrl = await uploadImageToStorage("blog-images", 999999, avatarUrl);
          if (uploadedUrl) {
            avatarUrl = uploadedUrl;
            data.avatar = uploadedUrl;
          }
        }

        try {
          if (!fs.existsSync(path.dirname(PROFILE_FILE_PATH))) {
            fs.mkdirSync(path.dirname(PROFILE_FILE_PATH), { recursive: true });
          }
          fs.writeFileSync(PROFILE_FILE_PATH, JSON.stringify(data, null, 2), "utf8");
        } catch (fileErr) {
          const tmpPath = "/tmp/settings_profile.json";
          try {
            fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf8");
          } catch (e) {
            console.error("Failed to write to tmp file:", e);
          }
        }

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
            console.error("Failed to upsert settings to Supabase:", error.message);
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

  // Handle standard bulk admin-sync
  applySameOriginHeaders(req, res, 'POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  if (!requireAdmin(req, res)) return;

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
      errors: []
    };

    // 1. Handle Blog Upserts in Bulk
    if (blogs && Array.isArray(blogs) && blogs.length > 0) {
      const dbRecords = (await Promise.all(blogs.map(async b => {
        const id = parseInt(b.id, 10);
        if (isNaN(id)) return null;

        let imageUrl = b.image_url || b.image || null;
        if (imageUrl && imageUrl.startsWith("data:image/")) {
          const uploadedUrl = await uploadImageToStorage("blog-images", id, imageUrl);
          if (uploadedUrl) {
            imageUrl = uploadedUrl;
          }
        }

        return {
          id,
          title: b.title || "",
          excerpt: b.excerpt || "",
          content: b.content || "",
          category: b.category || "",
          image_url: imageUrl,
          seo_title: b.seo_title || b.seoTitle || b.title || "",
          meta_description: b.meta_description || b.metaDescription || b.excerpt || "",
          focus_keyword: b.focus_keyword || b.focusKeyword || "",
          timestamp: b.timestamp || new Date().toISOString()
        };
      }))).filter((r) => r !== null);

      if (dbRecords.length > 0) {
        const { saved, errors } = await upsertRecords('blogs', dbRecords);
        results.blogsUpserted = saved;
        if (errors.length > 0) results.errors.push(...errors);
      }
    }

    // 2. Handle Product Upserts in Bulk
    if (products && Array.isArray(products) && products.length > 0) {
      const dbRecords = (await Promise.all(products.map(async p => {
        const id = parseInt(p.id, 10);
        if (isNaN(id)) return null;

        let imageUrl = p.image_url || p.url || p.image || null;
        if (imageUrl && imageUrl.startsWith("data:image/")) {
          const uploadedUrl = await uploadImageToStorage("product-images", id, imageUrl);
          if (uploadedUrl) {
            imageUrl = uploadedUrl;
          }
        }

        return {
          id,
          name: p.name || "",
          buy_url: p.buyUrl || p.buy_url || null,
          price: p.price || null,
          image_url: imageUrl,
          description: p.description || "",
          category: p.category || "",
          reviews: p.reviews || []
        };
      }))).filter((r) => r !== null);

      if (dbRecords.length > 0) {
        const { saved, errors } = await upsertRecords('products', dbRecords);
        results.productsUpserted = saved;
        if (errors.length > 0) results.errors.push(...errors);
      }
    }

    // 3. Handle Post/Vlog Upserts in Bulk
    if (posts && Array.isArray(posts) && posts.length > 0) {
      const dbRecords = (await Promise.all(posts.map(async po => {
        const id = parseInt(po.id, 10);
        if (isNaN(id)) return null;

        let url = po.url || "";
        if (url && url.startsWith("data:image/")) {
          const uploadedUrl = await uploadImageToStorage("blog-images", id, url);
          if (uploadedUrl) {
            url = uploadedUrl;
          }
        }

        return {
          id,
          url,
          type: po.type || "video",
          tagged_products: po.taggedProducts || po.tagged_products || []
        };
      }))).filter((r) => r !== null);

      if (dbRecords.length > 0) {
        const { saved, errors } = await upsertRecords('posts', dbRecords);
        results.postsUpserted = saved;
        if (errors.length > 0) results.errors.push(...errors);
      }
    }

    // 4. Handle Deletions in Bulk
    if (deletedBlogIds && Array.isArray(deletedBlogIds) && deletedBlogIds.length > 0) {
      const ids = deletedBlogIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
      if (ids.length > 0) {
        const { error } = await supabase.from('blogs').delete().in('id', ids);
        if (error) {
          results.errors.push(`Delete Blogs bulk: ${error.message}`);
        } else {
          results.blogsDeleted = ids.length;
        }
      }
    }

    if (deletedProductIds && Array.isArray(deletedProductIds) && deletedProductIds.length > 0) {
      const ids = deletedProductIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
      if (ids.length > 0) {
        const { error } = await supabase.from('products').delete().in('id', ids);
        if (error) {
          results.errors.push(`Delete Products bulk: ${error.message}`);
        } else {
          results.productsDeleted = ids.length;
        }
      }
    }

    if (deletedPostIds && Array.isArray(deletedPostIds) && deletedPostIds.length > 0) {
      const ids = deletedPostIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
      if (ids.length > 0) {
        const { error } = await supabase.from('posts').delete().in('id', ids);
        if (error) {
          results.errors.push(`Delete Posts bulk: ${error.message}`);
        } else {
          results.postsDeleted = ids.length;
        }
      }
    }

    // Return final response
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

  } catch (err) {
    console.error("Critical error in admin-sync handler:", err);
    return res.status(500).json({
      error: "Internal server error during synchronization",
      details: err.message || String(err)
    });
  }
}
