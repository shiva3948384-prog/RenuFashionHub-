-- Migration: Initial Schema Setup with Tables, Storage, and RLS Roles
-- Created: 2026-06-24

-- Create custom role type
CREATE TYPE public.user_role AS ENUM ('user', 'admin', 'owner');

-- 1. Create Profiles Table (Linked to Supabase Auth)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  role public.user_role NOT NULL DEFAULT 'user',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Create Products Table
CREATE TABLE public.products (
  id BIGINT PRIMARY KEY, -- Using bigints to map the Javascript timestamp IDs directly
  name TEXT NOT NULL,
  buy_url TEXT,
  price TEXT,
  image_url TEXT, -- Store public storage URL here instead of base64
  description TEXT,
  category TEXT,
  reviews JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 3. Create Blogs Table
CREATE TABLE public.blogs (
  id BIGINT PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  category TEXT,
  image_url TEXT, -- Store public storage URL here instead of base64
  seo_title TEXT,
  meta_description TEXT,
  focus_keyword TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Blogs
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- 4. Create Posts Table
CREATE TABLE public.posts (
  id BIGINT PRIMARY KEY,
  url TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'video',
  tagged_products JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;


-- ========================================================
-- HELPER FUNCTIONS FOR RLS & ROLE SECURITY
-- ========================================================

-- Function to check if a user is an admin or owner
CREATE OR REPLACE FUNCTION public.is_admin_or_owner(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role IN ('admin', 'owner')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================

-- Profiles RLS
CREATE POLICY "Allow public read of profiles"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Allow individuals to update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND (
    -- Don't allow users to upgrade their own role to admin/owner
    (role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
    OR public.is_admin_or_owner(auth.uid())
  )
);

CREATE POLICY "Allow admin/owners full control over profiles"
ON public.profiles FOR ALL
USING (public.is_admin_or_owner(auth.uid()));

-- Products RLS
CREATE POLICY "Allow public read access to products"
ON public.products FOR SELECT
USING (true);

CREATE POLICY "Allow admin and owner write access to products"
ON public.products FOR ALL
USING (public.is_admin_or_owner(auth.uid()))
WITH CHECK (public.is_admin_or_owner(auth.uid()));

-- Blogs RLS
CREATE POLICY "Allow public read access to blogs"
ON public.blogs FOR SELECT
USING (true);

CREATE POLICY "Allow admin and owner write access to blogs"
ON public.blogs FOR ALL
USING (public.is_admin_or_owner(auth.uid()))
WITH CHECK (public.is_admin_or_owner(auth.uid()));

-- Posts RLS
CREATE POLICY "Allow public read access to posts"
ON public.posts FOR SELECT
USING (true);

CREATE POLICY "Allow admin and owner write access to posts"
ON public.posts FOR ALL
USING (public.is_admin_or_owner(auth.uid()))
WITH CHECK (public.is_admin_or_owner(auth.uid()));


-- ========================================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- ========================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    new.id,
    new.email,
    COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'user'::public.user_role)
  )
  ON CONFLICT (id) DO UPDATE
  SET email = excluded.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ========================================================
-- STORAGE BUCKETS INITIALIZATION
-- ========================================================

INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('product-images', 'product-images', true),
  ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Allow public read access to product-images bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Allow admin write access to product-images bucket"
ON storage.objects FOR ALL
USING (bucket_id = 'product-images' AND public.is_admin_or_owner(auth.uid()))
WITH CHECK (bucket_id = 'product-images' AND public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Allow public read access to blog-images bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-images');

CREATE POLICY "Allow admin write access to blog-images bucket"
ON storage.objects FOR ALL
USING (bucket_id = 'blog-images' AND public.is_admin_or_owner(auth.uid()))
WITH CHECK (bucket_id = 'blog-images' AND public.is_admin_or_owner(auth.uid()));


-- ========================================================
-- DATABASE INDEXES FOR OPTIMAL PERFORMANCE
-- ========================================================

CREATE INDEX IF NOT EXISTS products_category_idx ON public.products (category);
CREATE INDEX IF NOT EXISTS blogs_category_idx ON public.blogs (category);
CREATE INDEX IF NOT EXISTS blogs_timestamp_idx ON public.blogs (timestamp DESC);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts (created_at DESC);
