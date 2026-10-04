import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

export default async function handler(req, res) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { entity, id, action } = req.query || {};

  // Infer entity from query param or URL path fallback
  let targetEntity = entity;
  if (!targetEntity) {
    const urlPath = req.url ? req.url.split('?')[0] : '';
    if (urlPath.includes('/blogs')) targetEntity = 'blogs';
    else if (urlPath.includes('/posts')) targetEntity = 'posts';
    else if (urlPath.includes('/products')) targetEntity = 'products';
  }

  // 1. BLOGS: GET /api/blogs
  if (targetEntity === 'blogs') {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed. Use GET.' });
    }
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;

      const mappedBlogs = (data || [])
        .filter(b => b.id !== 999999 && b.id !== 1782274718063 && b.category !== "site_settings" && b.title !== "ggdf" && b.status !== "draft" && b.status !== "pending_review")
        .map(b => ({
          id: b.id,
          title: b.title,
          excerpt: b.excerpt || "",
          content: b.content || "",
          category: b.category || "",
          image: b.image_url || "",
          seoTitle: b.seo_title || "",
          metaDescription: b.meta_description || "",
          focusKeyword: b.focus_keyword || "",
          status: b.status || "published",
          timestamp: b.timestamp || new Date().toISOString()
        }));

      return res.status(200).json(mappedBlogs);
    } catch (err) {
      console.error('Vercel API /api/blogs error:', err);
      return res.status(500).json({ error: err.message || String(err) });
    }
  }

  // 2. POSTS: GET /api/posts
  if (targetEntity === 'posts') {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed. Use GET.' });
    }
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;

      const mappedPosts = (data || []).map(po => ({
        id: po.id,
        url: po.url,
        type: po.type || "video",
        taggedProducts: po.tagged_products || [],
        created_at: po.created_at
      }));

      return res.status(200).json(mappedPosts);
    } catch (err) {
      console.error('Vercel API /api/posts error:', err);
      return res.status(500).json({ error: err.message || String(err) });
    }
  }

  // 3. PRODUCTS: GET /api/products & POST /api/products/:id/reviews
  if (targetEntity === 'products') {
    // Handle Post Reviews: POST /api/products/:id/reviews
    if (req.method === 'POST' && action === 'reviews' && id) {
      try {
        const productId = parseInt(id, 10);
        if (isNaN(productId)) {
          return res.status(400).json({ error: "Invalid product ID" });
        }

        const { user, rating, comment } = req.body || {};
        if (!user || !comment) {
          return res.status(400).json({ error: "Missing required fields: user or comment" });
        }
        const safeUser = String(user).trim().slice(0, 80);
        const safeComment = String(comment).trim().slice(0, 1000);
        const safeRating = Math.min(5, Math.max(1, Number(rating) || 5));
        if (!safeUser || !safeComment) {
          return res.status(400).json({ error: "Invalid review content" });
        }

        // 1. Fetch current product reviews
        const { data: product, error: fetchErr } = await supabase
          .from('products')
          .select('reviews')
          .eq('id', productId)
          .single();

        if (fetchErr || !product) {
          return res.status(404).json({ error: "Product not found" });
        }

        const reviews = Array.isArray(product.reviews) ? product.reviews : [];
        const newReview = {
          id: Date.now(),
          user: safeUser,
          rating: safeRating,
          comment: safeComment,
          date: new Date().toISOString()
        };

        reviews.push(newReview);

        // 2. Update reviews in Supabase
        const { error: updateErr } = await supabase
          .from('products')
          .update({ reviews })
          .eq('id', productId);

        if (updateErr) throw updateErr;

        return res.status(200).json({ success: true, review: newReview });
      } catch (err) {
        console.error('Vercel API POST /api/products/:id/reviews error:', err);
        return res.status(500).json({ error: err.message || String(err) });
      }
    }

    // Standard GET /api/products
    if (req.method === 'GET') {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('id', { ascending: false });

        if (error) throw error;

        const mappedProducts = (data || []).map(p => ({
          id: p.id,
          name: p.name,
          buyUrl: p.buy_url || "",
          price: p.price || "",
          url: p.image_url || "",
          description: p.description || "",
          category: p.category || "",
          reviews: p.reviews || [],
          created_at: p.created_at
        }));

        return res.status(200).json(mappedProducts);
      } catch (err) {
        console.error('Vercel API GET /api/products error:', err);
        return res.status(500).json({ error: err.message || String(err) });
      }
    }

    return res.status(405).json({ error: 'Method not allowed.' });
  }

  return res.status(400).json({ error: 'Missing or invalid entity parameter.' });
}
