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

    // 1. Handle Blog Upserts in Bulk
    if (blogs && Array.isArray(blogs) && blogs.length > 0) {
      const dbRecords = blogs.map(b => {
        const id = parseInt(b.id, 10);
        return {
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
      }).filter(b => !isNaN(b.id));

      if (dbRecords.length > 0) {
        const { error } = await supabase.from('blogs').upsert(dbRecords);
        if (error) {
          console.error(`Error bulk upserting blogs to Supabase:`, error.message);
          results.errors.push(`Blogs bulk upsert: ${error.message}`);
        } else {
          results.blogsUpserted = dbRecords.length;
        }
      }
    }

    // 2. Handle Product Upserts in Bulk
    if (products && Array.isArray(products) && products.length > 0) {
      const dbRecords = products.map(p => {
        const id = parseInt(p.id, 10);
        return {
          id,
          name: p.name || "",
          buy_url: p.buyUrl || p.buy_url || null,
          price: p.price || null,
          image_url: p.image_url || p.url || p.image || null,
          description: p.description || "",
          category: p.category || "",
          reviews: p.reviews || []
        };
      }).filter(p => !isNaN(p.id));

      if (dbRecords.length > 0) {
        const { error } = await supabase.from('products').upsert(dbRecords);
        if (error) {
          console.error(`Error bulk upserting products to Supabase:`, error.message);
          results.errors.push(`Products bulk upsert: ${error.message}`);
        } else {
          results.productsUpserted = dbRecords.length;
        }
      }
    }

    // 3. Handle Post/Vlog Upserts in Bulk
    if (posts && Array.isArray(posts) && posts.length > 0) {
      const dbRecords = posts.map(po => {
        const id = parseInt(po.id, 10);
        return {
          id,
          url: po.url || "",
          type: po.type || "video",
          tagged_products: po.taggedProducts || po.tagged_products || []
        };
      }).filter(po => !isNaN(po.id));

      if (dbRecords.length > 0) {
        const { error } = await supabase.from('posts').upsert(dbRecords);
        if (error) {
          console.error(`Error bulk upserting posts to Supabase:`, error.message);
          results.errors.push(`Posts bulk upsert: ${error.message}`);
        } else {
          results.postsUpserted = dbRecords.length;
        }
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
