// Auto blog generator for Renu Fashion Hub.
// Analyses newly added products with Gemini and publishes a full SEO blog post
// (title, meta description, focus keyword, tags, bolded keywords, internal links).
//
// Trigger modes:
//   1. Vercel Cron  -> GET /api/auto-blog            (Authorization: Bearer CRON_SECRET)
//   2. Admin panel  -> POST /api/auto-blog           (admin session cookie)
//   3. Manual       -> POST /api/auto-blog { productId: 123 }

import { createClient } from '@supabase/supabase-js';
import { isAdminRequest, applySameOriginHeaders } from './_auth.js';

const BASE_URL = 'https://www.renufashionhub.in';
const AUTHOR = 'Renu Agarwal';
const SITE_NAME = 'Renu Fashion Hub';
const MODEL = 'gemini-2.5-flash';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const CRON_SECRET = process.env.CRON_SECRET || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/* ---------- helpers ---------- */

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripHtml(str) {
  return String(str || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncate(str, max) {
  const clean = stripHtml(str);
  return clean.length <= max ? clean : clean.slice(0, max - 1).trim() + '\u2026';
}

function isAuthorized(req) {
  if (isAdminRequest(req)) return true;
  if (req.headers['x-vercel-cron']) return true;
  const auth = req.headers.authorization || '';
  if (CRON_SECRET && auth === `Bearer ${CRON_SECRET}`) return true;
  const qs = (req.query && req.query.secret) || '';
  if (CRON_SECRET && qs && qs === CRON_SECRET) return true;
  return false;
}

/* ---------- Gemini ---------- */

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' },
    seo_title: { type: 'STRING' },
    meta_description: { type: 'STRING' },
    focus_keyword: { type: 'STRING' },
    excerpt: { type: 'STRING' },
    category: { type: 'STRING' },
    tags: { type: 'ARRAY', items: { type: 'STRING' } },
    sections: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          heading: { type: 'STRING' },
          paragraphs: { type: 'ARRAY', items: { type: 'STRING' } },
          bullets: { type: 'ARRAY', items: { type: 'STRING' } },
        },
        required: ['heading', 'paragraphs'],
      },
    },
    faq: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { question: { type: 'STRING' }, answer: { type: 'STRING' } },
        required: ['question', 'answer'],
      },
    },
  },
  required: ['title', 'seo_title', 'meta_description', 'focus_keyword', 'excerpt', 'tags', 'sections'],
};

async function generateWithGemini(product) {
  const prompt = [
    `You are ${AUTHOR}, an Indian women's fashion creator writing for ${SITE_NAME}.`,
    'Write a helpful, original, human-sounding blog article about this product.',
    '',
    'PRODUCT',
    `Name: ${product.name}`,
    `Category: ${product.category || 'Fashion'}`,
    `Price: ${product.price || 'not listed'}`,
    `Description: ${stripHtml(product.description) || 'not provided'}`,
    '',
    'RULES',
    '- Target Indian women searching on Google for this kind of outfit.',
    '- Use a natural long-tail focus keyword (for example "banarasi silk saree for wedding").',
    '- 6 to 8 sections. Every section needs a specific heading and 1-2 paragraphs of 40-70 words.',
    '- Include sections on styling tips, fabric and quality, occasions, jewellery pairing, care and who it suits.',
    '- Inside paragraphs, wrap the most important keyword phrases in <strong> tags (3-6 times in total, never more).',
    '- Do not invent fake reviews, discounts, delivery claims or ratings.',
    '- meta_description must be under 155 characters. excerpt under 200 characters.',
    '- 5 to 8 tags, lowercase.',
    '- Add 3 FAQ entries with short practical answers.',
    '- Plain text only inside fields, except <strong> which is allowed inside paragraphs and bullets.',
  ].join('\n');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.85,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    }
  );

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Gemini request failed [${res.status}]: ${errorBody}`);
  }

  const json = await res.json();
  const parts = json && json.candidates && json.candidates[0] && json.candidates[0].content
    ? json.candidates[0].content.parts || []
    : [];
  const text = parts.map((p) => p.text || '').join('');
  if (!text) throw new Error('Gemini returned an empty response');
  return JSON.parse(text);
}

/* ---------- HTML builder ---------- */

// Only <strong> / <em> survive from the model output, everything else is escaped.
function sanitizeInline(str) {
  return escapeHtml(str)
    .replace(/&lt;strong&gt;/g, '<strong>')
    .replace(/&lt;\/strong&gt;/g, '</strong>')
    .replace(/&lt;em&gt;/g, '<em>')
    .replace(/&lt;\/em&gt;/g, '</em>');
}

function buildHtml(ai, product, related) {
  const productUrl = `${BASE_URL}/product/${product.id}`;
  const buyUrl = product.buy_url || productUrl;
  const parts = [];

  parts.push(`<div data-auto-blog="1" data-product-id="${product.id}">`);

  if (product.image_url) {
    parts.push(
      `<p><img src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.name)}" loading="lazy" decoding="async" /></p>`
    );
  }

  parts.push(`<p>${sanitizeInline(ai.excerpt)}</p>`);
  parts.push(
    `<p>Featured pick: <a href="${escapeHtml(productUrl)}"><strong>${escapeHtml(product.name)}</strong></a>` +
      (product.price ? ` &mdash; ${escapeHtml(product.price)}` : '') +
      '.</p>'
  );

  (ai.sections || []).forEach((section, index) => {
    parts.push(`<h2>${escapeHtml(section.heading)}</h2>`);
    (section.paragraphs || []).forEach((p) => parts.push(`<p>${sanitizeInline(p)}</p>`));
    if (section.bullets && section.bullets.length) {
      parts.push('<ul>' + section.bullets.map((b) => `<li>${sanitizeInline(b)}</li>`).join('') + '</ul>');
    }
    if (index === 1) {
      parts.push(
        '<p>You can see full photos, price and details of this piece on the ' +
          `<a href="${escapeHtml(productUrl)}">${escapeHtml(product.name)} product page</a>.</p>`
      );
    }
  });

  if (ai.faq && ai.faq.length) {
    parts.push('<h2>Frequently Asked Questions</h2>');
    ai.faq.forEach((item) => {
      parts.push(`<h3>${escapeHtml(item.question)}</h3>`);
      parts.push(`<p>${sanitizeInline(item.answer)}</p>`);
    });
  }

  if (related && related.length) {
    parts.push('<h2>More picks you may like</h2>');
    parts.push(
      '<ul>' +
        related
          .map(
            (r) =>
              `<li><a href="${BASE_URL}/product/${r.id}">${escapeHtml(r.name)}</a>` +
              (r.category ? ` &mdash; ${escapeHtml(r.category)}` : '') +
              '</li>'
          )
          .join('') +
        '</ul>'
    );
  }

  parts.push('<h2>Where to shop this look</h2>');
  parts.push(
    `<p><a href="${escapeHtml(buyUrl)}" rel="nofollow sponsored" target="_blank">Check the latest price for ${escapeHtml(
      product.name
    )}</a>. Browse more styling stories on the <a href="${BASE_URL}/blog">Renu Fashion Hub blog</a> or explore the full ` +
      `<a href="${BASE_URL}/?category=${encodeURIComponent(product.category || '')}">${escapeHtml(
        product.category || 'fashion'
      )} collection</a>.</p>`
  );

  parts.push(`<p><em>Tags: ${(ai.tags || []).map((t) => escapeHtml(t)).join(', ')}</em></p>`);
  parts.push('</div>');

  return parts.join('\n');
}

/* ---------- data helpers ---------- */

async function alreadyHasBlog(productId) {
  const { data } = await supabase
    .from('blogs')
    .select('id')
    .like('content', `%data-product-id="${productId}"%`)
    .limit(1);
  return Boolean(data && data.length);
}

async function pickProducts(limit, productId) {
  if (productId) {
    const { data } = await supabase.from('products').select('*').eq('id', productId).limit(1);
    return data || [];
  }
  const { data } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(40);
  const out = [];
  for (const product of data || []) {
    if (out.length >= limit) break;
    if (!product || !product.name) continue;
    // eslint-disable-next-line no-await-in-loop
    if (await alreadyHasBlog(product.id)) continue;
    out.push(product);
  }
  return out;
}

async function relatedProducts(product) {
  const { data } = await supabase
    .from('products')
    .select('id,name,category')
    .eq('category', product.category || '')
    .neq('id', product.id)
    .limit(4);
  return data || [];
}

async function publish(product) {
  const ai = await generateWithGemini(product);
  const related = await relatedProducts(product);
  const content = buildHtml(ai, product, related);
  const id = Date.now() + Math.floor(Math.random() * 1000);

  const row = {
    id,
    title: stripHtml(ai.title).slice(0, 140),
    excerpt: truncate(ai.excerpt, 200),
    content,
    category: ai.category || product.category || 'Fashion',
    image_url: product.image_url || null,
    seo_title: truncate(ai.seo_title, 65),
    meta_description: truncate(ai.meta_description, 155),
    focus_keyword: stripHtml(ai.focus_keyword).slice(0, 80),
    timestamp: new Date().toISOString(),
  };

  const { error } = await supabase.from('blogs').insert(row);
  if (error) throw new Error(`Failed to insert blog: ${error.message}`);

  return { blogId: id, productId: product.id, title: row.title, url: `${BASE_URL}/blog/${id}` };
}

/* ---------- handler ---------- */

export default async function handler(req, res) {
  applySameOriginHeaders(req, res, 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();

  res.setHeader('Cache-Control', 'no-store');

  if (!isAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });
  if (!GEMINI_API_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Supabase credentials are not configured' });
  }

  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch (_) {
    body = {};
  }

  const productId = body.productId || (req.query && req.query.productId) || null;
  const limit = Math.min(Number(body.limit || (req.query && req.query.limit) || 2) || 2, 5);

  try {
    const products = await pickProducts(limit, productId);
    if (!products.length) {
      return res.status(200).json({ generated: 0, message: 'No new products need a blog post right now.' });
    }

    const results = [];
    const errors = [];
    for (const product of products) {
      try {
        // eslint-disable-next-line no-await-in-loop
        results.push(await publish(product));
      } catch (err) {
        errors.push({ productId: product.id, error: String((err && err.message) || err) });
      }
    }

    return res.status(200).json({ generated: results.length, results, errors });
  } catch (err) {
    console.error('auto-blog failed:', err);
    return res.status(500).json({ error: String((err && err.message) || err) });
  }
}
