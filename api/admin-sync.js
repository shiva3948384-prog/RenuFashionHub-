// Serverless helper to synchronize frontend changes directly to Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Initialize Supabase with Service Role key to bypass RLS policies
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

export default async function handler(req, res) {
  // Allow OPTIONS pre-flight request for CORS if needed
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

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

    // Return final response
    res.setHeader('Access-Control-Allow-Origin', '*');
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
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      error: "Internal server error during synchronization",
      details: err.message || String(err)
    });
  }
}
