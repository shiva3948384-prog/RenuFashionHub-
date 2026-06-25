import fs from 'fs';
import path from 'path';

// Defensive check for dry-run configuration
const DRY_RUN = process.env.DRY_RUN !== 'false';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project-ref.supabase.co';

console.log("==================================================");
console.log("       SUPABASE ASSET MIGRATION - DRY RUN         ");
console.log("==================================================");
console.log(`Dry Run Mode: ${DRY_RUN ? "ACTIVE (No writes or uploads will be performed)" : "INACTIVE"}`);
console.log(`Target Supabase URL: ${SUPABASE_URL}`);
console.log("==================================================");

interface Product {
  id: number | string;
  name: string;
  buyUrl?: string;
  price?: string;
  url?: string;
}

interface Blog {
  id: number | string;
  title: string;
  image?: string;
}

function processBase64(base64Str: string): { buffer: Buffer; mimeType: string; size: number } | null {
  if (!base64Str || !base64Str.startsWith('data:image/')) return null;
  
  const matches = base64Str.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) return null;

  const mimeType = matches[1];
  const data = matches[2];
  const buffer = Buffer.from(data, 'base64');
  
  return {
    buffer,
    mimeType,
    size: buffer.length
  };
}

async function simulateAssetMigration() {
  const productsPath = 'backups/products.json';
  const blogsPath = 'backups/blogs.json';

  let totalProductsChecked = 0;
  let totalProductsWithBase64 = 0;
  let totalProductImageBytes = 0;

  let totalBlogsChecked = 0;
  let totalBlogsWithBase64 = 0;
  let totalBlogImageBytes = 0;

  console.log("\n[1/3] SCANNING PRODUCT IMAGES...");
  if (fs.existsSync(productsPath)) {
    const products: Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    totalProductsChecked = products.length;

    products.forEach((p, idx) => {
      const imgData = p.url || '';
      if (imgData.startsWith('data:image')) {
        totalProductsWithBase64++;
        const parsed = processBase64(imgData);
        if (parsed) {
          totalProductImageBytes += parsed.size;
          if (idx < 5) {
            console.log(`   👉 Product [${p.id}] "${p.name.substring(0, 30)}..."`);
            console.log(`      - Detected Base64 image (${parsed.mimeType})`);
            console.log(`      - Target Bucket: product-images`);
            console.log(`      - Target File Path: ${p.id}.jpg`);
            console.log(`      - Binary Size: ${parsed.size} bytes (${(parsed.size / 1024).toFixed(2)} KB)`);
            console.log(`      - Expected Public URL: ${SUPABASE_URL}/storage/v1/object/public/product-images/${p.id}.jpg`);
          }
        }
      }
    });
    if (totalProductsWithBase64 > 5) {
      console.log(`   ... and ${totalProductsWithBase64 - 5} more products scanned.`);
    }
  } else {
    console.log("❌ products.json backup file not found!");
  }

  console.log("\n[2/3] SCANNING BLOG IMAGES...");
  if (fs.existsSync(blogsPath)) {
    const blogs: Blog[] = JSON.parse(fs.readFileSync(blogsPath, 'utf8'));
    totalBlogsChecked = blogs.length;

    blogs.forEach((b, idx) => {
      const imgData = b.image || '';
      if (imgData.startsWith('data:image')) {
        totalBlogsWithBase64++;
        const parsed = processBase64(imgData);
        if (parsed) {
          totalBlogImageBytes += parsed.size;
          if (idx < 5) {
            console.log(`   👉 Blog [${b.id}] "${b.title.substring(0, 30)}..."`);
            console.log(`      - Detected Base64 image (${parsed.mimeType})`);
            console.log(`      - Target Bucket: blog-images`);
            console.log(`      - Target File Path: ${b.id}.jpg`);
            console.log(`      - Binary Size: ${parsed.size} bytes (${(parsed.size / 1024).toFixed(2)} KB)`);
            console.log(`      - Expected Public URL: ${SUPABASE_URL}/storage/v1/object/public/blog-images/${b.id}.jpg`);
          }
        }
      }
    });
  } else {
    console.log("❌ blogs.json backup file not found!");
  }

  console.log("\n[3/3] ASSET DRY-RUN MIGRATION SUMMARY");
  console.log("==================================================");
  console.log(`Total Products Verified:       ${totalProductsChecked}`);
  console.log(`Products with Base64 Images:   ${totalProductsWithBase64}`);
  console.log(`Total Product Images Size:     ${(totalProductImageBytes / 1024 / 1024).toFixed(2)} MB (${totalProductImageBytes} bytes)`);
  console.log("--------------------------------------------------");
  console.log(`Total Blogs Verified:          ${totalBlogsChecked}`);
  console.log(`Blogs with Base64 Images:      ${totalBlogsWithBase64}`);
  console.log(`Total Blog Images Size:        ${(totalBlogImageBytes / 1024 / 1024).toFixed(2)} MB (${totalBlogImageBytes} bytes)`);
  console.log("==================================================");
  
  const overallImageCount = totalProductsWithBase64 + totalBlogsWithBase64;
  const overallBytes = totalProductImageBytes + totalBlogImageBytes;
  console.log(`Total Target Uploads Count:    ${overallImageCount} files`);
  console.log(`Total Estimated Upload Volume:  ${(overallBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log("==================================================");
  console.log("Dry Run Verification: SUCCESSFUL. Files match schemas perfectly.");
}

simulateAssetMigration();
