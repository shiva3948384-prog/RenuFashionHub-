import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file.");
  console.log("Please define them in your .env file or run with environment variables:");
  console.log("SUPABASE_URL=https://your-project.supabase.co SUPABASE_SERVICE_ROLE_KEY=your-key npx tsx migrate-supabase-live.ts\n");
  process.exit(1);
}

// Initialize Supabase client with the service role key to bypass RLS policies
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

interface Product {
  id: number;
  name: string;
  buyUrl?: string;
  price?: string;
  url?: string;
  description?: string;
  category?: string;
  reviews?: any[];
}

interface Blog {
  id: number;
  title: string;
  excerpt?: string;
  content?: string;
  category?: string;
  image?: string;
  seoTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  timestamp?: string;
}

interface Post {
  id: number;
  url: string;
  type?: string;
  taggedProducts?: number[];
}

// Parse base64 string helper
function parseBase64(base64Str: string): { buffer: Buffer; mimeType: string } | null {
  if (!base64Str || !base64Str.startsWith('data:image/')) return null;
  const matches = base64Str.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) return null;
  return {
    mimeType: matches[1],
    buffer: Buffer.from(matches[2], 'base64')
  };
}

async function uploadImageToStorage(
  bucket: string,
  id: number,
  base64Str: string
): Promise<string | null> {
  const parsed = parseBase64(base64Str);
  if (!parsed) return null;

  const fileName = `${id}.jpg`;
  
  // Perform upload with upsert: true so the migration can be safely resumed/overwritten
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, parsed.buffer, {
      contentType: parsed.mimeType,
      upsert: true
    });

  if (error) {
    console.error(`   ⚠️ Failed to upload image for ID ${id} to ${bucket}:`, error.message);
    return null;
  }

  // Generate the public URL
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return publicUrl;
}

async function migrateProducts() {
  const productsPath = 'backups/products.json';
  if (!fs.existsSync(productsPath)) {
    console.log("⚠️ No products backup file found at backups/products.json. Skipping products migration.");
    return;
  }

  const products: Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  console.log(`\n📦 Starting migration of ${products.length} products...`);

  let successCount = 0;
  let uploadCount = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    process.stdout.write(`   [${i + 1}/${products.length}] Processing product ID ${p.id}... `);

    let imageUrl = p.url || '';
    if (imageUrl.startsWith('data:image')) {
      const uploadedUrl = await uploadImageToStorage('product-images', p.id, imageUrl);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
        uploadCount++;
      }
    }

    const dbRecord = {
      id: p.id,
      name: p.name,
      buy_url: p.buyUrl || null,
      price: p.price || null,
      image_url: imageUrl || null,
      description: p.description || '',
      category: p.category || '',
      reviews: p.reviews || []
    };

    // Upsert into products table
    const { error } = await supabase.from('products').upsert(dbRecord);

    if (error) {
      console.log(`❌ Failed: ${error.message}`);
    } else {
      console.log(`✅ Success`);
      successCount++;
    }
  }

  console.log(`🎉 Products Migration Complete: ${successCount}/${products.length} products upserted. ${uploadCount} images uploaded.`);
}

async function migrateBlogs() {
  const blogsPath = 'backups/blogs.json';
  if (!fs.existsSync(blogsPath)) {
    console.log("⚠️ No blogs backup file found at backups/blogs.json. Skipping blogs migration.");
    return;
  }

  const blogs: Blog[] = JSON.parse(fs.readFileSync(blogsPath, 'utf8'));
  console.log(`\n✍️ Starting migration of ${blogs.length} blogs...`);

  let successCount = 0;
  let uploadCount = 0;

  for (let i = 0; i < blogs.length; i++) {
    const b = blogs[i];
    process.stdout.write(`   [${i + 1}/${blogs.length}] Processing blog ID ${b.id}... `);

    let imageUrl = b.image || '';
    if (imageUrl.startsWith('data:image')) {
      const uploadedUrl = await uploadImageToStorage('blog-images', b.id, imageUrl);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
        uploadCount++;
      }
    }

    const dbRecord = {
      id: b.id,
      title: b.title,
      excerpt: b.excerpt || '',
      content: b.content || '',
      category: b.category || '',
      image_url: imageUrl || null,
      seo_title: b.seoTitle || '',
      meta_description: b.metaDescription || '',
      focus_keyword: b.focusKeyword || '',
      timestamp: b.timestamp || new Date().toISOString()
    };

    // Upsert into blogs table
    const { error } = await supabase.from('blogs').upsert(dbRecord);

    if (error) {
      console.log(`❌ Failed: ${error.message}`);
    } else {
      console.log(`✅ Success`);
      successCount++;
    }
  }

  console.log(`🎉 Blogs Migration Complete: ${successCount}/${blogs.length} blogs upserted. ${uploadCount} images uploaded.`);
}

async function migratePosts() {
  const postsPath = 'backups/posts.json';
  if (!fs.existsSync(postsPath)) {
    console.log("⚠️ No posts backup file found at backups/posts.json. Skipping posts migration.");
    return;
  }

  const posts: Post[] = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
  console.log(`\n📱 Starting migration of ${posts.length} posts...`);

  let successCount = 0;

  for (let i = 0; i < posts.length; i++) {
    const po = posts[i];
    process.stdout.write(`   [${i + 1}/${posts.length}] Processing post ID ${po.id}... `);

    const dbRecord = {
      id: po.id,
      url: po.url,
      type: po.type || 'video',
      tagged_products: po.taggedProducts || []
    };

    // Upsert into posts table
    const { error } = await supabase.from('posts').upsert(dbRecord);

    if (error) {
      console.log(`❌ Failed: ${error.message}`);
    } else {
      console.log(`✅ Success`);
      successCount++;
    }
  }

  console.log(`🎉 Posts Migration Complete: ${successCount}/${posts.length} posts upserted.`);
}

async function runMigration() {
  console.log("==================================================");
  console.log("       SUPABASE LIVE MIGRATION STARTED            ");
  console.log("==================================================");
  console.log(`Source backups dir: backups/`);
  console.log(`Target database:    ${SUPABASE_URL}`);
  console.log("==================================================");

  try {
    await migrateProducts();
    await migrateBlogs();
    await migratePosts();
    console.log("\n==================================================");
    console.log("   🎉 MIGRATION PROCESS FULLY COMPLETE! 🎉       ");
    console.log("==================================================");
  } catch (err: any) {
    console.error("\n❌ Migration process aborted due to critical error:", err.message || err);
  }
}

runMigration();
