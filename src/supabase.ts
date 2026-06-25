import { createClient } from '@supabase/supabase-js';

// React Client-side Supabase Config
// Cast to any to prevent TS compiler errors regarding Vite's standard ImportMeta extension
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
