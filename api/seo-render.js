// Crawler-visible content layer on top of api/seo-handler.js.
//
// seo-handler injects per-page <title>, meta tags, JSON-LD and a <noscript>
// summary. Crawlers that ignore <noscript> (and Semrush's site audit with JS
// rendering disabled) therefore saw a page with no <h1>, almost no text and no
// internal links. This wrapper renders that same per-page content as real HTML
// inside <div id="root">, which React replaces on hydration.

import seoHandler from './_seo-handler.js';

const BASE_URL = 'https://www.renufashionhub.in';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Fashion Blog' },
  { href: '/about', label: 'About Renu Agarwal' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/terms-of-service', label: 'Terms of Service' },
  { href: '/disclaimer', label: 'Disclaimer' },
];

const CATEGORY_LINKS = [
  { href: '/?category=Sarees', label: 'Sarees' },
  { href: '/?category=Kurtas', label: 'Kurtis & Kurta Sets' },
  { href: '/?category=Lehengas', label: 'Lehengas' },
  { href: '/?category=Dresses', label: 'Western Dresses' },
  { href: '/?category=Jewelry', label: 'Jewellery' },
];

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function firstMatch(html, regex) {
  const match = html.match(regex);
  return match ? match[1].trim() : '';
}

function buildRootBlock(html, is404 = false) {
  if (is404) {
    return `<div id="root"><div data-seo-fallback="1" style="max-width: 680px; margin: 48px auto; padding: 32px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; color: #1c1917;">
      <h1 style="font-size: 32px; font-weight: 800; margin-bottom: 12px; color: #881337;">404 — Page Not Found</h1>
      <p style="font-size: 16px; color: #57534e; margin-bottom: 24px; line-height: 1.6;">The page you are looking for does not exist, has been removed, or is temporarily unavailable.</p>
      <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-bottom: 32px;">
        <a href="${BASE_URL}/" style="display: inline-block; padding: 12px 24px; background: #e11d48; color: #ffffff; text-decoration: none; border-radius: 9999px; font-weight: 600; font-size: 14px;">Return to Homepage</a>
        <a href="${BASE_URL}/blog" style="display: inline-block; padding: 12px 24px; background: #f5f5f4; color: #1c1917; text-decoration: none; border-radius: 9999px; font-weight: 600; font-size: 14px; border: 1px solid #e7e5e4;">Explore Fashion Blog</a>
        <a href="${BASE_URL}/contact" style="display: inline-block; padding: 12px 24px; background: #f5f5f4; color: #1c1917; text-decoration: none; border-radius: 9999px; font-weight: 600; font-size: 14px; border: 1px solid #e7e5e4;">Contact Support</a>
      </div>
      <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 12px; color: #1c1917;">Browse Popular Collections</h2>
      <ul style="list-style: none; padding: 0; margin: 0 auto; display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
        ${CATEGORY_LINKS.map(link => `<li><a href="${link.href}" style="color: #e11d48; text-decoration: underline; font-weight: 500;">${escapeHtml(link.label)}</a></li>`).join('')}
      </ul>
    </div></div>`;
  }

  const noscript = firstMatch(html, /<noscript>([\s\S]*?)<\/noscript>/i);
  const h1 = firstMatch(noscript, /<h1>([\s\S]*?)<\/h1>/i) || 'Renu Fashion Hub';
  const summary = firstMatch(noscript, /<p>([\s\S]*?)<\/p>/i);
  const description = firstMatch(html, /<meta name="description" content="([^"]*)"/i);
  const title = firstMatch(html, /<title>([\s\S]*?)<\/title>/i);

  const paragraphs = [summary, description]
    .map((text) => String(text || '').trim())
    .filter((text, index, all) => text && all.indexOf(text) === index);

  return `<div id="root"><div data-seo-fallback="1">
      <h1>${h1}</h1>
      ${paragraphs.map((p) => `<p>${p}</p>`).join('\n      ')}
      <p>Renu Fashion Hub is curated by fashion creator Renu Agarwal. Every saree, kurti,
      lehenga, western dress and jewellery pick on this page is hand-selected with styling
      notes, occasion ideas, fabric guidance and honest shopping advice for Indian women.
      Browse the sections below to find the right outfit for weddings, festivals, office
      wear and everyday styling.</p>
      <h2>Shop by category</h2>
      <ul>${CATEGORY_LINKS.map(
        (link) => `<li><a href="${link.href}">${escapeHtml(link.label)}</a></li>`
      ).join('')}</ul>
      <h2>Explore Renu Fashion Hub</h2>
      <ul>${NAV_LINKS.map(
        (link) => `<li><a href="${link.href}">${escapeHtml(link.label)}</a></li>`
      ).join('')}</ul>
      <p>Read the latest styling guides on the <a href="${BASE_URL}/blog">Renu Fashion Hub
      fashion blog</a>, learn more <a href="${BASE_URL}/about">about Renu Agarwal</a>, or
      <a href="${BASE_URL}/contact">contact the team</a> for styling and collaboration
      enquiries.</p>
      <p>${escapeHtml(title)}</p>
    </div></div>`;
}

export default async function handler(req, res) {
  let statusCode = 200;
  let body = '';
  let sent = false;

  const proxy = {
    setHeader: (...args) => res.setHeader(...args),
    getHeader: (...args) => res.getHeader(...args),
    removeHeader: (...args) => res.removeHeader(...args),
    status(code) {
      statusCode = code;
      return proxy;
    },
    json(payload) {
      sent = true;
      res.status(statusCode).json(payload);
      return proxy;
    },
    end(payload) {
      body = typeof payload === 'string' ? payload : body;
      return proxy;
    },
    send(payload) {
      body = typeof payload === 'string' ? payload : String(payload || '');
      return proxy;
    },
  };

  try {
    await seoHandler(req, proxy);
  } catch (err) {
    console.error('seo-render: base handler failed:', err);
  }

  if (sent) return;

  const is404 = statusCode === 404;
  let html = body;
  try {
    if (html && /<div id="root">\s*<\/div>/i.test(html)) {
      html = html.replace(/<div id="root">\s*<\/div>/i, buildRootBlock(html, is404));
    }
  } catch (err) {
    console.error('seo-render: injection failed:', err);
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (is404) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400');
  }
  return res.status(statusCode).send(html);
}
