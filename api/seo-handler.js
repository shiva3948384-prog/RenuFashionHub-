// Serverless dynamic SEO and metadata injector for Renu Fashion Hub.
// Injects unique <title>, meta, canonical, og/twitter tags, JSON-LD schema
// and crawler-visible <noscript> content for both static pages and dynamic
// product / blog / post routes. Content is rendered server-side so that
// Google, AI Overviews, ChatGPT, Perplexity and Claude can read the page
// without executing JavaScript.

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const baseUrl = "https://www.renufashionhub.in";
const siteName = "Renu Fashion Hub";
const authorName = "Renu Agarwal";
const defaultImage = `${baseUrl}/og-image.jpg`;
const defaultTitle = "Renu Fashion Hub | Sarees, Kurtis, Jewellery & Style Guides by Renu Agarwal";
const defaultDescription = "Renu Fashion Hub by Renu Agarwal — women's fashion inspiration, saree & kurti styling, jewellery picks, outfit ideas and honest shopping guides for Indian women.";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

/* ---------- helpers ---------- */

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function stripHtml(str) {
  return String(str || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function truncate(str, max = 155) {
  const clean = stripHtml(str);
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}…`;
}

function toIsoDate(value) {
  if (!value) return null;
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch (_) {
    return null;
  }
}

/* ---------- static page metadata ---------- */

const staticPages = {
  home: {
    title: defaultTitle,
    description: defaultDescription,
    path: "/",
    ogType: "website",
    h1: "Renu Fashion Hub — Women's Fashion, Sarees, Kurtis, Jewellery & Style Guides",
    body: "Renu Fashion Hub, curated by Renu Agarwal, is a destination for Indian women's fashion inspiration: saree styling, kurti trends, lehenga guides, jewellery picks, western outfit ideas, seasonal shopping guides and honest beauty tips."
  },
  about: {
    title: "About Renu Agarwal | Founder of Renu Fashion Hub",
    description: "Meet Renu Agarwal — fashion creator behind Renu Fashion Hub. Her styling journey, editorial mission and philosophy behind every saree, kurti and jewellery pick on the site.",
    path: "/about",
    ogType: "profile",
    h1: "About Renu Agarwal",
    body: "Renu Agarwal is a fashion and lifestyle creator with over 1M followers across Instagram, YouTube and Facebook. Renu Fashion Hub is her curated catalog and editorial home for Indian women's fashion — sarees, kurtis, lehengas, jewellery and everyday styling inspiration."
  },
  blog: {
    title: "Fashion Blog | Saree, Kurti & Styling Guides — Renu Fashion Hub",
    description: "Fashion blog by Renu Agarwal. Trend reports, saree draping guides, kurti pairing ideas, lehenga inspiration, jewellery styling and seasonal shopping guides for Indian women.",
    path: "/blog",
    ogType: "website",
    h1: "Renu Fashion Hub Blog",
    body: "Editorial fashion articles by Renu Agarwal covering saree draping and styling, kurti trends, lehenga inspiration, western outfit ideas, jewellery picks and seasonal shopping guides for Indian women."
  },
  contact: {
    title: "Contact Renu Fashion Hub | Styling Enquiries & Support",
    description: "Contact Renu Fashion Hub for styling enquiries, collaboration requests, product questions or support. Email, phone and location details for Renu Agarwal's team.",
    path: "/contact",
    ogType: "website",
    h1: "Contact Renu Fashion Hub",
    body: "Get in touch with the Renu Fashion Hub team for styling questions, collaboration enquiries or support with products featured on the site."
  },
  privacy: {
    title: "Privacy Policy | Renu Fashion Hub",
    description: "Privacy policy of Renu Fashion Hub — what data we collect, how analytics is used, cookie policy and how your contact information is handled.",
    path: "/privacy-policy",
    ogType: "website",
    h1: "Privacy Policy",
    body: "This privacy policy explains what data Renu Fashion Hub collects, how analytics and cookies are used, and how visitor information is handled."
  },
  terms: {
    title: "Terms of Service | Renu Fashion Hub",
    description: "Terms of service for Renu Fashion Hub — operating rules for the catalog, affiliate product recommendations, user-generated content and intellectual property.",
    path: "/terms-of-service",
    ogType: "website",
    h1: "Terms of Service",
    body: "Terms of service governing use of Renu Fashion Hub, affiliate product recommendations and any user-submitted content."
  },
  disclaimer: {
    title: "Disclaimer | Renu Fashion Hub",
    description: "Disclaimer for Renu Fashion Hub — affiliate commission disclosure, third-party product responsibility and accuracy of styling recommendations.",
    path: "/disclaimer",
    ogType: "website",
    h1: "Disclaimer",
    body: "Renu Fashion Hub may earn affiliate commissions on some product links. Product availability and pricing are governed by third-party retailers."
  },
};

/* ---------- JSON-LD builders ---------- */

function jsonLd(obj) {
  return `<script type="application/ld+json">${JSON.stringify(obj)}</script>`;
}

function websiteAndOrgLd() {
  return [
    jsonLd({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": siteName,
      "url": `${baseUrl}/`,
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${baseUrl}/?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    }),
    jsonLd({
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": siteName,
      "url": `${baseUrl}/`,
      "logo": `${baseUrl}/favicon.svg`,
      "founder": {
        "@type": "Person",
        "name": authorName,
        "sameAs": [
          "https://www.instagram.com/renu_agarwal_vlogs",
          "https://youtube.com/@renuagarwalvlogs",
          "https://www.facebook.com/share/17YfgJkGda/"
        ]
      },
      "sameAs": [
        "https://www.instagram.com/renu_agarwal_vlogs",
        "https://youtube.com/@renuagarwalvlogs",
        "https://www.facebook.com/share/17YfgJkGda/"
      ]
    })
  ].join('\n');
}

function breadcrumbLd(items) {
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((it, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": it.name,
      "item": it.url
    }))
  });
}

function articleLd({ title, description, image, url, datePublished, dateModified }) {
  const obj = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": title,
    "description": description,
    "image": image ? [image] : undefined,
    "mainEntityOfPage": { "@type": "WebPage", "@id": url },
    "url": url,
    "author": { "@type": "Person", "name": authorName, "url": `${baseUrl}/about` },
    "publisher": {
      "@type": "Organization",
      "name": siteName,
      "logo": { "@type": "ImageObject", "url": `${baseUrl}/favicon.svg` }
    }
  };
  if (datePublished) obj.datePublished = datePublished;
  if (dateModified) obj.dateModified = dateModified;
  return jsonLd(obj);
}

function productLd({ name, description, image, url, price, currency, sku, brand }) {
  const obj = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": name,
    "description": description,
    "image": image ? [image] : undefined,
    "url": url,
    "brand": { "@type": "Brand", "name": brand || siteName }
  };
  if (sku) obj.sku = String(sku);
  if (price) {
    obj.offers = {
      "@type": "Offer",
      "price": String(price),
      "priceCurrency": currency || "INR",
      "availability": "https://schema.org/InStock",
      "url": url
    };
  }
  return jsonLd(obj);
}

/* ---------- data fetchers ---------- */

async function fetchOne(table, id) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
    if (error) return null;
    return data;
  } catch (_) {
    return null;
  }
}

/* ---------- SEO payload builders ---------- */

async function buildPayload(type, id, pageName) {
  // Static pages
  if (type === "page") {
    const page = staticPages[pageName] || staticPages.home;
    const url = `${baseUrl}${page.path}`;
    const scripts = [];
    scripts.push(websiteAndOrgLd());
    if (page.path !== "/") {
      scripts.push(breadcrumbLd([
        { name: "Home", url: `${baseUrl}/` },
        { name: page.h1, url },
      ]));
    }
    return {
      title: page.title,
      description: page.description,
      image: defaultImage,
      url,
      ogType: page.ogType,
      h1: page.h1,
      body: page.body,
      extraHead: scripts.join('\n'),
    };
  }

  // Blog
  if (type === "blog") {
    const cleanId = String(id || "").split("?")[0];
    const numeric = parseInt(cleanId, 10);
    if (Number.isFinite(numeric)) {
      const data = await fetchOne("blogs", numeric);
      if (data && data.id !== 999999 && data.category !== "site_settings") {
        const title = data.seo_title || `${data.title} | Renu Fashion Hub`;
        const description = truncate(data.meta_description || data.excerpt || data.content || defaultDescription);
        const image = data.image_url || defaultImage;
        const url = `${baseUrl}/blog/${cleanId}`;
        const datePublished = toIsoDate(data.created_at || data.timestamp);
        const dateModified = toIsoDate(data.updated_at || data.created_at || data.timestamp);
        const scripts = [
          articleLd({ title, description, image, url, datePublished, dateModified }),
          breadcrumbLd([
            { name: "Home", url: `${baseUrl}/` },
            { name: "Blog", url: `${baseUrl}/blog` },
            { name: stripHtml(data.title || title), url },
          ])
        ].join('\n');
        return {
          title,
          description,
          image,
          url,
          ogType: "article",
          h1: stripHtml(data.title || title),
          body: truncate(data.excerpt || data.content || description, 600),
          extraHead: scripts,
        };
      }
    }
  }

  // Product
  if (type === "product") {
    const cleanId = String(id || "").split("?")[0];
    const numeric = parseInt(cleanId, 10);
    if (Number.isFinite(numeric)) {
      const data = await fetchOne("products", numeric);
      if (data) {
        const title = `${data.name} | Renu Fashion Hub`;
        const description = truncate(data.description || `${data.name} — fashion pick, styling details and shopping guide at Renu Fashion Hub.`);
        const image = data.image_url || defaultImage;
        const url = `${baseUrl}/product/${cleanId}`;
        const scripts = [
          productLd({
            name: data.name,
            description,
            image,
            url,
            price: data.price,
            currency: data.currency,
            sku: data.sku || data.id,
            brand: data.brand,
          }),
          breadcrumbLd([
            { name: "Home", url: `${baseUrl}/` },
            { name: data.category || "Shop", url: `${baseUrl}/` },
            { name: data.name, url },
          ])
        ].join('\n');
        return {
          title,
          description,
          image,
          url,
          ogType: "product",
          h1: data.name,
          body: truncate(data.description || description, 600),
          extraHead: scripts,
        };
      }
    }
  }

  // Post
  if (type === "post") {
    const cleanId = String(id || "").split("?")[0];
    const numeric = parseInt(cleanId, 10);
    if (Number.isFinite(numeric)) {
      const data = await fetchOne("posts", numeric);
      if (data) {
        const title = `${data.caption ? stripHtml(data.caption).slice(0, 60) : `Fashion Style Post ${cleanId}`} | Renu Fashion Hub`;
        const description = truncate(data.caption || "Latest outfit style, lookbook and collection recommendation from Renu Fashion Hub.");
        const image = data.type === "image" && data.url ? data.url : defaultImage;
        const url = `${baseUrl}/post/${cleanId}`;
        const datePublished = toIsoDate(data.created_at || data.timestamp);
        const scripts = [
          articleLd({ title, description, image, url, datePublished }),
          breadcrumbLd([
            { name: "Home", url: `${baseUrl}/` },
            { name: "Posts", url: `${baseUrl}/` },
            { name: title.replace(" | Renu Fashion Hub", ""), url },
          ])
        ].join('\n');
        return {
          title,
          description,
          image,
          url,
          ogType: "article",
          h1: title.replace(" | Renu Fashion Hub", ""),
          body: truncate(data.caption || description, 400),
          extraHead: scripts,
        };
      }
    }
  }

  // Fallback = home
  return buildPayload("page", null, "home");
}

/* ---------- HTML template loader ---------- */

function loadTemplate() {
  try {
    const distPath = path.join(process.cwd(), "dist", "index.html");
    if (fs.existsSync(distPath)) return fs.readFileSync(distPath, "utf8");
  } catch (_) {}
  try {
    return fs.readFileSync(path.join(process.cwd(), "index.html"), "utf8");
  } catch (_) {
    return `<!doctype html><html lang="en-IN"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head><body><div id="root"></div></body></html>`;
  }
}

/* ---------- handler ---------- */

export default async function handler(req, res) {
  const { type, id, name } = req.query || {};

  let payload;
  try {
    payload = await buildPayload(type, id, name);
  } catch (err) {
    console.error("seo-handler payload error:", err);
    payload = await buildPayload("page", null, "home");
  }

  let html = loadTemplate();

  try {
    // Strip existing head tags we plan to replace
    html = html.replace(/<title>[\s\S]*?<\/title>/gi, "");
    html = html.replace(/<meta\s+[^>]*name=["'](?:description|keywords|twitter:card|twitter:title|twitter:description|twitter:image|author|robots)["'][^>]*>/gi, "");
    html = html.replace(/<meta\s+[^>]*property=["'](?:og:title|og:description|og:type|og:image|og:image:width|og:image:height|og:url|og:site_name|og:locale)["'][^>]*>/gi, "");
    html = html.replace(/<link\s+[^>]*rel=["']canonical["'][^>]*>/gi, "");
    // Strip existing JSON-LD scripts to avoid duplicates from the base template
    html = html.replace(/<script\s+type=["']application\/ld\+json["'][\s\S]*?<\/script>/gi, "");

    const t = escapeHtml(payload.title);
    const d = escapeHtml(payload.description);
    const u = escapeHtml(payload.url);
    const img = escapeHtml(payload.image);
    const ogType = escapeHtml(payload.ogType);

    const injected = `
    <title>${t}</title>
    <meta name="description" content="${d}" />
    <meta name="author" content="${escapeHtml(authorName)}" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <link rel="canonical" href="${u}" />

    <meta property="og:site_name" content="${escapeHtml(siteName)}" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:url" content="${u}" />
    <meta property="og:image" content="${img}" />
    <meta property="og:locale" content="en_IN" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${img}" />

    ${payload.extraHead || ""}
`;

    html = html.replace(/<\/head>/i, `${injected}\n</head>`);

    // Inject crawler-visible content inside <noscript> so AI crawlers
    // (which do not execute JS) can read the page's headline and summary.
    const noscriptBlock = `
    <noscript>
      <h1>${escapeHtml(payload.h1)}</h1>
      <p>${escapeHtml(payload.body)}</p>
      <p><a href="${u}">${escapeHtml(payload.h1)} — ${escapeHtml(siteName)}</a></p>
    </noscript>`;

    // Replace any existing <noscript>...</noscript> block, or insert after <body>
    if (/<noscript>[\s\S]*?<\/noscript>/i.test(html)) {
      html = html.replace(/<noscript>[\s\S]*?<\/noscript>/i, noscriptBlock);
    } else {
      html = html.replace(/<body([^>]*)>/i, `<body$1>${noscriptBlock}`);
    }

    // Ensure lang="en-IN"
    html = html.replace(/<html\b[^>]*>/i, `<html lang="en-IN">`);
  } catch (err) {
    console.error("seo-handler injection failed:", err);
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=60, s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).send(html);
}
