// CORS-free image download proxy for both CDN URLs and Base64 Data-URLs
const ALLOWED_IMAGE_HOSTS = new Set([
  "renufashionhub.in",
  "www.renufashionhub.in",
  "api.iconify.design",
  "images.unsplash.com",
]);

function isAllowedImageUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:") return false;
    if (ALLOWED_IMAGE_HOSTS.has(parsed.hostname)) return true;
    return parsed.hostname.endsWith(".supabase.co") || parsed.hostname.endsWith(".supabase.in");
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  const { url } = req.query || {};
  if (!url) {
    return res.status(400).json({ error: "Missing image url parameter" });
  }

  try {
    // 1. Handle base64 Data-URLs
    if (url.startsWith('data:')) {
      const match = url.match(/^data:([^;]+);base64,(.*)$/);
      if (!match) {
        return res.status(400).json({ error: "Invalid data URL format" });
      }
      const contentType = match[1];
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');
      const ext = contentType.split('/')[1] || 'jpg';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="profile_image.${ext}"`);
      return res.status(200).send(buffer);
    }

    // 2. Handle external URLs (CDN / Storage / etc.)
    if (!isAllowedImageUrl(url)) {
      return res.status(400).json({ error: "Image host is not allowed" });
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith("image/")) {
      return res.status(400).json({ error: "URL did not return an image" });
    }

    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > 5 * 1024 * 1024) {
      return res.status(413).json({ error: "Image is too large" });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(413).json({ error: "Image is too large" });
    }
    const ext = contentType.split('/')[1] || 'jpg';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="profile_image.${ext}"`);
    return res.status(200).send(buffer);
  } catch (error) {
    console.error("Download image proxy error:", error);
    // Fallback redirect
    return res.redirect(url);
  }
}
