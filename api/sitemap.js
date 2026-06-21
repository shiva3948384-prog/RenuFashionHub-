// Dynamic sitemap generator for Vercel Serverless Function
export default async function handler(req, res) {
  const projectId = "ai-studio-applet-webapp-644f0";
  const databaseId = "ai-studio-06f9cdf8-bcdb-4985-98dd-f7d34d6cf66c";
  const baseRESTUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`;

  const baseUrl = "https://www.renufashionhub.in";

  // Helper to fetch collection items via Firestore REST API
  async function fetchCollectionIds(collectionName) {
    try {
      const url = `${baseRESTUrl}/${collectionName}?pageSize=300`;
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Error fetching ${collectionName}:`, response.statusText);
        return [];
      }
      const data = await response.json();
      if (!data.documents) return [];
      
      return data.documents.map(doc => {
        // Extract the Firestore document ID (last segment of the document name)
        const nameParts = doc.name.split('/');
        return nameParts[nameParts.length - 1];
      });
    } catch (err) {
      console.error(`Failed to fetch collection ${collectionName}:`, err);
      return [];
    }
  }

  // Fetch all dynamic entries in parallel
  const [productIds, postIds, blogIds] = await Promise.all([
    fetchCollectionIds("products"),
    fetchCollectionIds("posts"),
    fetchCollectionIds("blogs")
  ]);

  // Construct XML sitemap
  let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static Pages -->
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/login</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
`;

  // Dynamic Products
  productIds.forEach(id => {
    sitemapXml += `  <url>
    <loc>${baseUrl}/product/${id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
  });

  // Dynamic Posts/Vlogs
  postIds.forEach(id => {
    sitemapXml += `  <url>
    <loc>${baseUrl}/post/${id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>\n`;
  });

  // Dynamic Blogs
  blogIds.forEach(id => {
    sitemapXml += `  <url>
    <loc>${baseUrl}/blog/${id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
  });

  sitemapXml += `</urlset>`;

  // Serve as XML
  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
  res.status(200).send(sitemapXml);
}
