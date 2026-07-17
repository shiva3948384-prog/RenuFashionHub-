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

  const { id, action } = req.query;

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

  // Otherwise, handle standard GET /api/products
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
