// CORS-free image download proxy for both CDN URLs and Base64 Data-URLs
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
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/jpeg';
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
