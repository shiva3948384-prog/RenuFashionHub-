// Dynamic sitemap generator for Renu Fashion Hub
export default async function handler(req, res) {
  const projectId = "ai-studio-applet-webapp-644f0";
  const databaseId = "ai-studio-06f9cdf8-bcdb-4985-98dd-f7d34d6cf66c";
  const baseRESTUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`;
  const baseUrl = "https://www.renufashionhub.in";

  // Helper to fetch collection items via Firestore REST API with full document fields
  async function fetchCollectionDocs(collectionName) {
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
        const nameParts = doc.name.split('/');
        const id = nameParts[nameParts.length - 1];
        
        let lastmod = "";
        if (doc.updateTime) {
          lastmod = doc.updateTime.split('.')[0] + 'Z';
        }

        let category = "";
        try {
          if (doc.fields && doc.fields.category && doc.fields.category.stringValue) {
            category = doc.fields.category.stringValue;
          }
        } catch (e) {
          // ignore
        }

        return { id, lastmod, category };
      });
    } catch (err) {
      console.error(`Failed to fetch collection ${collectionName}:`, err);
      return [];
    }
  }

  // Fetch collections in parallel
  const [products, posts, blogs] = await Promise.all([
    fetchCollectionDocs("products"),
    fetchCollectionDocs("posts"),
    fetchCollectionDocs("blogs")
  ]);

  // Aggregate unique active categories
  const staticCategories = ["Sarees", "Kurtas", "Lehengas", "Dresses", "Jewelry"];
  const dynamicCategories = new Set(staticCategories);
  
  products.forEach(p => {
    if (p.category && p.category.toLowerCase() !== "other") {
      dynamicCategories.add(p.category.charAt(0).toUpperCase() + p.category.slice(1).toLowerCase());
    }
  });

  posts.forEach(p => {
    if (p.category && p.category.toLowerCase() !== "other") {
      dynamicCategories.add(p.category.charAt(0).toUpperCase() + p.category.slice(1).toLowerCase());
    }
  });

  // Start constructing the sitemap XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Core Static Pages -->
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
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
    <loc>${baseUrl}/privacy-policy</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/terms-of-service</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/disclaimer</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
`;

  // Categories query URLs
  Array.from(dynamicCategories).forEach(cat => {
    xml += `  <url>
    <loc>${baseUrl}/?category=${encodeURIComponent(cat)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>\n`;
  });

  // Dynamic Products
  products.forEach(p => {
    xml += `  <url>
    <loc>${baseUrl}/product/${p.id}</loc>
    <lastmod>${p.lastmod || "2026-06-22T00:00:00Z"}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
  });

  // Dynamic Posts/Vlogs
  posts.forEach(p => {
    xml += `  <url>
    <loc>${baseUrl}/post/${p.id}</loc>
    <lastmod>${p.lastmod || "2026-06-22T00:00:00Z"}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>\n`;
  });

  // Dynamic Blogs
  blogs.forEach(b => {
    xml += `  <url>
    <loc>${baseUrl}/blog/${b.id}</loc>
    <lastmod>${b.lastmod || "2026-06-22T00:00:00Z"}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
  });

  xml += `</urlset>`;

  // Serve as XML content type
  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
  res.status(200).send(xml);
}
